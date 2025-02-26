from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.models import db, Playlist, Track

playlist_routes = Blueprint('playlists', __name__)

# Create a new playlist
@playlist_routes.route('/', methods=['POST'])
@login_required
def create_playlist():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Playlist name is required.'}), 400

    # Create a new playlist associated with the current user
    playlist = Playlist(name=name, user_id=current_user.id)
    db.session.add(playlist)
    db.session.commit()
    return jsonify(playlist.to_dict()), 201

# Get details for a specific playlist (and its tracks)
@playlist_routes.route('/<int:playlist_id>', methods=['GET'])
@login_required
def get_playlist(playlist_id):
    playlist = Playlist.query.get_or_404(playlist_id)
    if playlist.user_id != current_user.id:
        abort(403)
    return jsonify(playlist.to_dict())

# Update playlist details (e.g. change the name)
@playlist_routes.route('/<int:playlist_id>', methods=['PUT', 'PATCH'])
@login_required
def update_playlist(playlist_id):
    playlist = Playlist.query.get_or_404(playlist_id)
    if playlist.user_id != current_user.id:
        abort(403)
    data = request.get_json() or {}
    if 'name' in data:
        playlist.name = data['name']
    db.session.commit()
    return jsonify(playlist.to_dict())

# Add a track to the playlist
@playlist_routes.route('/<int:playlist_id>/tracks', methods=['POST'])
@login_required
def add_track_to_playlist(playlist_id):
    playlist = Playlist.query.get_or_404(playlist_id)
    if playlist.user_id != current_user.id:
        abort(403)
    
    data = request.get_json() or {}
    track_id = data.get('track_id')
    if not track_id:
        return jsonify({'error': 'track_id is required.'}), 400

    # Find the track to add
    track = Track.query.get(track_id)
    if not track:
        return jsonify({'error': 'Track not found.'}), 404

    # Prevent adding a track that is already in the playlist
    if track in playlist.tracks:
        return jsonify({'error': 'Track already in playlist.'}), 400

    playlist.tracks.append(track)
    db.session.commit()
    return jsonify(playlist.to_dict()), 200

# Remove a track from the playlist
@playlist_routes.route('/<int:playlist_id>/tracks/<int:track_id>', methods=['DELETE'])
@login_required
def remove_track_from_playlist(playlist_id, track_id):
    playlist = Playlist.query.get_or_404(playlist_id)
    if playlist.user_id != current_user.id:
        abort(403)
    
    track = Track.query.get_or_404(track_id)
    if track not in playlist.tracks:
        return jsonify({'error': 'Track not in playlist.'}), 404

    playlist.tracks.remove(track)
    db.session.commit()
    return jsonify(playlist.to_dict()), 200

# Add bulk track operations
def add_tracks_to_playlist(playlist_id):
    playlist = Playlist.query.get_or_404(playlist_id)
    data = request.get_json() or {}
    track_ids = data.get('track_ids', [])
    
    tracks = Track.query.filter(Track.id.in_(track_ids)).all()
    playlist.tracks.extend(tracks)
    db.session.commit()

def get_playlist_tracks(playlist_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    playlist = Playlist.query.get_or_404(playlist_id)
    tracks = playlist.tracks.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
