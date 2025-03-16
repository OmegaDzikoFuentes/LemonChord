import os
import uuid
import boto3
from datetime import datetime
from sqlalchemy import func
from flask import Blueprint, request, jsonify, abort, current_app, render_template, redirect, url_for, flash
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from app.models import db, Track, Like 
from app.utils.errors import (
    api_success, api_error, ValidationError, AuthorizationError, 
    FileUploadError, validate_file_size, validate_file_extension
)

# Import the upload form
from app.forms.upload_form import UploadForm

tracks_routes = Blueprint('tracks', __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a'}
# Maximum file size (100MB)
MAX_CONTENT_LENGTH = 100 * 1024 * 1024

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
            aws_access_key_id=current_app.config.get('S3_KEY'),
            aws_secret_access_key=current_app.config.get('S3_SECRET')
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
        return f"https://{bucket_name}.s3.amazonaws.com/{filename}"
    except Exception as e:
        current_app.logger.error(f"S3 upload error: {str(e)}")
        raise FileUploadError(f"Failed to upload file to S3: {str(e)}")

def delete_file_from_s3(file_url):
    """Delete a file from AWS S3 bucket"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=current_app.config.get('S3_KEY'),
            aws_secret_access_key=current_app.config.get('S3_SECRET')
        )
        
        bucket_name = current_app.config.get('S3_BUCKET')
        # Extract key from URL
        file_key = file_url.split(f"https://{bucket_name}.s3.amazonaws.com/")[1]
        
        s3_client.delete_object(
            Bucket=bucket_name,
            Key=file_key
        )
        return True
    except Exception as e:
        current_app.logger.error(f"S3 delete error: {str(e)}")
        return False

# Existing API endpoint for programmatic uploads
@tracks_routes.route('/', methods=['POST'])
@login_required
def create_track():
    try:
        title = request.form.get('title')
        genre = request.form.get('genre')
        duration = request.form.get('duration')
        audio_file = request.files.get('audio_file')

        # Validate required fields
        if not title:
            raise ValidationError("Title is required", errors={"title": "Required field"})
        if not audio_file:
            raise ValidationError("Audio file is required", errors={"audio_file": "Required field"})
        
        # Validate file type and size
        validate_file_extension(audio_file.filename, ALLOWED_EXTENSIONS)
        validate_file_size(audio_file, max_size_mb=MAX_CONTENT_LENGTH//(1024*1024))
        
        # Generate a secure, unique filename using the original filename for extension extraction
        unique_filename = generate_unique_filename(secure_filename(audio_file.filename))
        
        # Store file (S3 or local)
        if current_app.config.get('USE_S3', False):
            file_url = upload_file_to_s3(audio_file, unique_filename)
        else:
            # Fall back to local storage
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, unique_filename)
            audio_file.save(file_path)
            file_url = file_path

        # Create new track record without original_filename
        new_track = Track(
            title=title,
            audio_url=file_url,
            genre=genre,
            duration=duration,
            user_id=current_user.id
        )
        
        db.session.add(new_track)
        db.session.commit()
        return api_success(new_track.to_dict(), "Track uploaded successfully", 201)
        
    except ValidationError as e:
        raise
    except FileUploadError as e:
        raise
    except Exception as e:
        db.session.rollback()
        if 'file_url' in locals():
            if current_app.config.get('USE_S3', False):
                delete_file_from_s3(file_url)
            elif 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
        current_app.logger.error(f"Unexpected error creating track: {str(e)}")
        raise

# New route: Form integration for uploading a track using Flask-WTF
@tracks_routes.route('/upload/form', methods=['GET', 'POST'])
@login_required
def upload_track_form():
    form = UploadForm()
    if form.validate_on_submit():
        try:
            title = form.title.data
            genre = form.genre.data
            duration = form.duration.data
            audio_file = form.audio_file.data

            # (The FileAllowed validator on the form ensures proper extension,
            # but we still check file size.)
            validate_file_size(audio_file, max_size_mb=MAX_CONTENT_LENGTH//(1024*1024))

            unique_filename = generate_unique_filename(secure_filename(audio_file.filename))
            
            if current_app.config.get('USE_S3', False):
                file_url = upload_file_to_s3(audio_file, unique_filename)
            else:
                upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, unique_filename)
                audio_file.save(file_path)
                file_url = file_path

            new_track = Track(
                title=title,
                audio_url=file_url,
                genre=genre,
                duration=duration,
                user_id=current_user.id
            )
            db.session.add(new_track)
            db.session.commit()
            flash("Track uploaded successfully", "success")
            return redirect(url_for('tracks.get_track', track_id=new_track.id))
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error uploading track via form: {str(e)}")
            flash("An error occurred while uploading your track.", "danger")
    return render_template('upload_track.html', form=form)

# Route to "listen" to a track (i.e. get its details)
@tracks_routes.route('/<int:track_id>', methods=['GET'])
def get_track(track_id):
    track = Track.query.get_or_404(track_id)
    # Dynamically compute the like count
    like_count = db.session.query(func.count(Like.track_id))\
                           .filter(Like.track_id == track_id).scalar()
    track_data = track.to_dict()
    track_data['like_count'] = like_count
    return api_success(track_data)
@tracks_routes.route('/user', methods=['GET'])
@login_required
def get_user_tracks():
    user_tracks = Track.query.filter_by(user_id=current_user.id)\
                     .order_by(Track.created_at.desc()).all()
    tracks_data = [track.to_dict() for track in user_tracks]
    return api_success(data={'tracks': tracks_data})


# Route to update track information
@tracks_routes.route('/<int:track_id>', methods=['PUT', 'PATCH'])
@login_required
def update_track(track_id):
    try:
        track = Track.query.filter_by(id=track_id, user_id=current_user.id).first_or_404()
        old_file_url = None
        file_url = None
        
        if request.content_type and 'multipart/form-data' in request.content_type:
            if 'title' in request.form:
                track.title = request.form.get('title')
            if 'genre' in request.form:
                track.genre = request.form.get('genre')
            if 'duration' in request.form:
                track.duration = request.form.get('duration')
            
            if 'audio_file' in request.files:
                audio_file = request.files['audio_file']
                validate_file_extension(audio_file.filename, ALLOWED_EXTENSIONS)
                validate_file_size(audio_file, max_size_mb=MAX_CONTENT_LENGTH//(1024*1024))
                unique_filename = generate_unique_filename(secure_filename(audio_file.filename))
                old_file_url = track.audio_url
                if current_app.config.get('USE_S3', False):
                    file_url = upload_file_to_s3(audio_file, unique_filename)
                else:
                    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
                    os.makedirs(upload_folder, exist_ok=True)
                    file_path = os.path.join(upload_folder, unique_filename)
                    audio_file.save(file_path)
                    file_url = file_path
                track.audio_url = file_url
        else:
            data = request.get_json() or {}
            if 'title' in data:
                track.title = data['title']
            if 'genre' in data:
                track.genre = data['genre']
            if 'duration' in data:
                track.duration = data['duration']
        
        db.session.commit()
        
        if old_file_url:
            if current_app.config.get('USE_S3', False):
                delete_file_from_s3(old_file_url)
            else:
                if os.path.exists(old_file_url):
                    os.remove(old_file_url)
        
        return api_success(track.to_dict(), "Track updated successfully")
        
    except ValidationError:
        raise
    except FileUploadError:
        if file_url and current_app.config.get('USE_S3', False):
            delete_file_from_s3(file_url)
        elif 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        db.session.rollback()
        raise
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating track {track_id}: {str(e)}")
        raise

# Route to delete a track
@tracks_routes.route('/<int:track_id>', methods=['DELETE'])
@login_required
def delete_track(track_id):
    try:
        track = Track.query.filter_by(id=track_id, user_id=current_user.id).first_or_404()
        if track.user_id != current_user.id:
            raise AuthorizationError("You don't have permission to delete this track")
        
        file_url = track.audio_url
        
        db.session.delete(track)
        db.session.commit()
        
        if current_app.config.get('USE_S3', False):
            delete_file_from_s3(file_url)
        else:
            if os.path.exists(file_url):
                os.remove(file_url)
            
        return api_success(message="Track deleted successfully")
        
    except AuthorizationError:
        raise
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting track {track_id}: {str(e)}")
        raise
