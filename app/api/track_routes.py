import os
import uuid
import boto3
from datetime import datetime
from flask import Blueprint, request, jsonify, abort, current_app
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from app.models import db, Track

tracks_routes = Blueprint('tracks', __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a'}
# Maximum file size (10MB)
MAX_CONTENT_LENGTH = 10 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename):
    """Generate a unique filename with UUID and timestamp to prevent collisions"""
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{uuid.uuid4().hex}_{int(datetime.now().timestamp())}"
    if ext:
        unique_filename = f"{unique_filename}.{ext}"
    return unique_filename

def upload_file_to_s3(file, filename):
    """Upload a file to AWS S3 bucket"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY'),
            aws_secret_access_key=current_app.config.get('AWS_SECRET_KEY'),
            region_name=current_app.config.get('AWS_REGION')
        )
        
        bucket_name = current_app.config.get('S3_BUCKET')
        s3_client.upload_fileobj(
            file,
            bucket_name,
            filename,
            ExtraArgs={
                'ACL': 'public-read',
                'ContentType': file.content_type
            }
        )
        
        # Generate the URL for the uploaded file
        return f"https://{bucket_name}.s3.{current_app.config.get('AWS_REGION')}.amazonaws.com/{filename}"
    except Exception as e:
        current_app.logger.error(f"S3 upload error: {str(e)}")
        return None

def delete_file_from_s3(file_url):
    """Delete a file from AWS S3 bucket"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY'),
            aws_secret_access_key=current_app.config.get('AWS_SECRET_KEY'),
            region_name=current_app.config.get('AWS_REGION')
        )
        
        bucket_name = current_app.config.get('S3_BUCKET')
        # Extract key from URL
        file_key = file_url.split(f"https://{bucket_name}.s3.{current_app.config.get('AWS_REGION')}.amazonaws.com/")[1]
        
        s3_client.delete_object(
            Bucket=bucket_name,
            Key=file_key
        )
        return True
    except Exception as e:
        current_app.logger.error(f"S3 delete error: {str(e)}")
        return False

# Route to create/upload a new track
@tracks_routes.route('/', methods=['POST'])
@login_required
def create_track():
    title = request.form.get('title')
    genre = request.form.get('genre')
    duration = request.form.get('duration')  # Expecting duration in seconds
    audio_file = request.files.get('audio_file')

    # Validate required fields
    if not title:
        return jsonify({'error': 'Title is required.'}), 400
    if not audio_file:
        return jsonify({'error': 'Audio file is required.'}), 400
    
    # Validate file type
    if not allowed_file(audio_file.filename):
        return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    # Check file size
    if request.content_length > MAX_CONTENT_LENGTH:
        return jsonify({'error': f'File too large. Maximum size: {MAX_CONTENT_LENGTH // (1024 * 1024)}MB'}), 400
    
    # Generate a secure, unique filename
    original_filename = secure_filename(audio_file.filename)
    unique_filename = generate_unique_filename(original_filename)
    
    # Use AWS S3 if configured, otherwise use local storage
    if current_app.config.get('USE_S3', False):
        file_url = upload_file_to_s3(audio_file, unique_filename)
        if not file_url:
            return jsonify({'error': 'Failed to upload file to S3.'}), 500
    else:
        # Fall back to local storage
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        audio_file.save(file_path)
        file_url = file_path  # For local storage, file_url is the local path

    # Create new track record
    new_track = Track(
        title=title,
        audio_url=file_url,
        genre=genre,
        duration=duration,
        user_id=current_user.id,
        original_filename=original_filename  # Store original filename for reference
    )
    
    try:
        db.session.add(new_track)
        db.session.commit()
        return jsonify(new_track.to_dict()), 201
    except Exception as e:
        # Rollback transaction on error
        db.session.rollback()
        # Delete the uploaded file if database operation fails
        if current_app.config.get('USE_S3', False):
            delete_file_from_s3(file_url)
        else:
            os.remove(file_path) if os.path.exists(file_path) else None
        return jsonify({'error': f'Failed to create track: {str(e)}'}), 500

# Route to "listen" to a track (i.e. get its details)
@tracks_routes.route('/<int:track_id>', methods=['GET'])
def get_track(track_id):
    track = Track.query.get_or_404(track_id)
    return jsonify(track.to_dict())

# Route to update track information
@tracks_routes.route('/<int:track_id>', methods=['PUT', 'PATCH'])
@login_required
def update_track(track_id):
    track = Track.query.filter_by(id=track_id, user_id=current_user.id).first_or_404()

    # Handle form data for file uploads and JSON data for other updates
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Update from form data
        if 'title' in request.form:
            track.title = request.form.get('title')
        if 'genre' in request.form:
            track.genre = request.form.get('genre')
        if 'duration' in request.form:
            track.duration = request.form.get('duration')
        
        # Handle audio file update
        if 'audio_file' in request.files:
            audio_file = request.files['audio_file']
            
            # Validate file
            if not allowed_file(audio_file.filename):
                return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
            
            if request.content_length > MAX_CONTENT_LENGTH:
                return jsonify({'error': f'File too large. Maximum size: {MAX_CONTENT_LENGTH // (1024 * 1024)}MB'}), 400
            
            # Generate unique filename
            original_filename = secure_filename(audio_file.filename)
            unique_filename = generate_unique_filename(original_filename)
            
            # Store old file URL to delete after successful update
            old_file_url = track.audio_url
            
            # Upload new file
            if current_app.config.get('USE_S3', False):
                file_url = upload_file_to_s3(audio_file, unique_filename)
                if not file_url:
                    return jsonify({'error': 'Failed to upload file to S3.'}), 500
            else:
                upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, unique_filename)
                audio_file.save(file_path)
                file_url = file_path
            
            # Update track with new file info
            track.audio_url = file_url
            track.original_filename = original_filename
            
            # Delete old file after successful update
            try:
                db.session.commit()
                if current_app.config.get('USE_S3', False):
                    delete_file_from_s3(old_file_url)
                else:
                    os.remove(old_file_url) if os.path.exists(old_file_url) else None
            except Exception as e:
                db.session.rollback()
                # Remove new file if update fails
                if current_app.config.get('USE_S3', False):
                    delete_file_from_s3(file_url)
                else:
                    os.remove(file_path) if os.path.exists(file_path) else None
                return jsonify({'error': f'Failed to update track: {str(e)}'}), 500
    else:
        # Accept JSON data for basic updates
        data = request.get_json() or {}
        
        if 'title' in data:
            track.title = data['title']
        if 'genre' in data:
            track.genre = data['genre']
        if 'duration' in data:
            track.duration = data['duration']
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to update track: {str(e)}'}), 500

    return jsonify(track.to_dict())

# Route to delete a track
@tracks_routes.route('/<int:track_id>', methods=['DELETE'])
@login_required
def delete_track(track_id):
    track = Track.query.filter_by(id=track_id, user_id=current_user.id).first_or_404()

    # Only the owner may delete the track
    if track.user_id != current_user.id:
        abort(403)
    
    # Store file URL for deletion after database record is removed
    file_url = track.audio_url
    
    try:
        db.session.delete(track)
        db.session.commit()
        
        # Delete the associated file
        if current_app.config.get('USE_S3', False):
            delete_file_from_s3(file_url)
        else:
            os.remove(file_url) if os.path.exists(file_url) else None
            
        return jsonify({'message': 'Track deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete track: {str(e)}'}), 500