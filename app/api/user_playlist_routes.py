from flask import Blueprint, request
from flask_login import current_user, login_required
from app.models import db, Playlist, Track
from app.utils.errors import (
    api_success, 
    ValidationError, 
    AuthorizationError, 
    ResourceNotFoundError
)

# Optionally, change the blueprint name to "playlist" for clarity.
playlist_routes = Blueprint('playlist', __name__)

# Create a new playlist
@playlist_routes.route('/', methods=['POST'])
@login_required
def create_playlist():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        raise ValidationError("Playlist name is required", errors={"name": "Required field"})
    
    playlist = Playlist(name=name, user_id=current_user.id)
    db.session.add(playlist)
    db.session.commit()
    return api_success(data=playlist.to_dict(), message="Playlist created", status_code=201)

# Get details for a specific playlist (and its tracks)
@playlist_routes.route('/<int:playlist_id>', methods=['GET'])
@login_required
def get_playlist(playlist_id):
    playlist = Playlist.query.get(playlist_id)
    if not playlist:
        raise ResourceNotFoundError("Playlist")
    if playlist.user_id != current_user.id:
        raise AuthorizationError("Access denied")
    return api_success(data=playlist.to_dict())

# Update playlist details (e.g., change the name)
@playlist_routes.route('/<int:playlist_id>', methods=['PUT', 'PATCH'])
@login_required
def update_playlist(playlist_id):
    playlist = Playlist.query.get(playlist_id)
    if not playlist:
        raise ResourceNotFoundError("Playlist")
    if playlist.user_id != current_user.id:
        raise AuthorizationError("Access denied")
    
    data = request.get_json() or {}
    if 'name' in data:
        playlist.name = data['name']
    db.session.commit()
    return api_success(data=playlist.to_dict(), message="Playlist updated")

# Add a track to the playlist
@playlist_routes.route('/<int:playlist_id>/tracks', methods=['POST'])
@login_required
def add_track_to_playlist(playlist_id):
    playlist = Playlist.query.get(playlist_id)
    if not playlist:
        raise ResourceNotFoundError("Playlist")
    if playlist.user_id != current_user.id:
        raise AuthorizationError("Access denied")
    
    data = request.get_json() or {}
    track_id = data.get('track_id')
    if not track_id:
        raise ValidationError("track_id is required", errors={"track_id": "Required field"})
    
    track = Track.query.get(track_id)
    if not track:
        raise ResourceNotFoundError("Track")
    
    if track in playlist.tracks:
        raise ValidationError("Track already in playlist")
    
    playlist.tracks.append(track)
    db.session.commit()
    return api_success(data=playlist.to_dict(), message="Track added to playlist", status_code=200)

# Remove a track from the playlist
@playlist_routes.route('/<int:playlist_id>/tracks/<int:track_id>', methods=['DELETE'])
@login_required
def remove_track_from_playlist(playlist_id, track_id):
    playlist = Playlist.query.get(playlist_id)
    if not playlist:
        raise ResourceNotFoundError("Playlist")
    if playlist.user_id != current_user.id:
        raise AuthorizationError("Access denied")
    
    track = Track.query.get(track_id)
    if not track:
        raise ResourceNotFoundError("Track")
    if track not in playlist.tracks:
        raise ValidationError("Track not in playlist")
    
    playlist.tracks.remove(track)
    db.session.commit()
    return api_success(data=playlist.to_dict(), message="Track removed from playlist", status_code=200)
