import os
from flask import Blueprint, request, jsonify, abort, current_app
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from app.models import db, Track

tracks_routes = Blueprint('tracks', __name__)

# Route to create/upload a new track
@tracks_routes.route('/', methods=['POST'])
@login_required
def create_track():
    title = request.form.get('title')
    genre = request.form.get('genre')
    duration = request.form.get('duration')  # Expecting duration in seconds
    audio_file = request.files.get('audio_file')

    if not title or not audio_file:
        return jsonify({'error': 'Title and audio file are required.'}), 400

    # Secure the filename and save the file to the designated uploads folder
    filename = secure_filename(audio_file.filename)
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    audio_file.save(file_path)

    # Create new track record; note that audio_url may be a local path or an S3 URL if using AWS
    new_track = Track(
        title=title,
        audio_url=file_path,
        genre=genre,
        duration=duration,
        user_id=current_user.id
    )
    db.session.add(new_track)
    db.session.commit()

    return jsonify(new_track.to_dict()), 201

# Route to "listen" to a track (i.e. get its details)
@tracks_routes.route('/<int:track_id>', methods=['GET'])
def get_track(track_id):
    track = Track.query.get_or_404(track_id)
    return jsonify(track.to_dict())

# Route to update track information
@tracks_routes.route('/<int:track_id>', methods=['PUT', 'PATCH'])
@login_required
def update_track(track_id):
    track = Track.query.get_or_404(track_id)

    # Ensure that only the owner can update the track
    if track.user_id != current_user.id:
        abort(403)

    # Accept JSON data for updates
    data = request.get_json() or {}

    if 'title' in data:
        track.title = data['title']
    if 'genre' in data:
        track.genre = data['genre']
    if 'duration' in data:
        track.duration = data['duration']

    # Optionally, if you allow updating the audio file, you'll need to handle file upload here.
    # For example:
    # if 'audio_file' in request.files:
    #     audio_file = request.files['audio_file']
    #     filename = secure_filename(audio_file.filename)
    #     file_path = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), filename)
    #     audio_file.save(file_path)
    #     track.audio_url = file_path

    db.session.commit()
    return jsonify(track.to_dict())

# Route to delete a track
@tracks_routes.route('/<int:track_id>', methods=['DELETE'])
@login_required
def delete_track(track_id):
    track = Track.query.get_or_404(track_id)

    # Only the owner may delete the track
    if track.user_id != current_user.id:
        abort(403)

    db.session.delete(track)
    db.session.commit()
    return jsonify({'message': 'Track deleted successfully'})
