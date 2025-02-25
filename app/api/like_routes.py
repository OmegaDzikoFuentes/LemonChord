from flask import Blueprint, jsonify, abort
from flask_login import current_user, login_required
from app.models import db, Like, Track

likes_routes = Blueprint('likes', __name__)

# Like a track
@likes_routes.route('/tracks/<int:track_id>/like', methods=['POST'])
@login_required
def like_track(track_id):
    track = Track.query.get_or_404(track_id)

    # Check if already liked
    existing_like = Like.query.filter_by(user_id=current_user.id, track_id=track_id).first()
    if existing_like:
        return jsonify({'error': 'Track already liked.'}), 400

    like = Like(user_id=current_user.id, track_id=track_id)
    db.session.add(like)
    db.session.commit()
    return jsonify({'message': 'Track liked successfully.'}), 201

# Unlike a track
@likes_routes.route('/tracks/<int:track_id>/like', methods=['DELETE'])
@login_required
def unlike_track(track_id):
    like = Like.query.filter_by(user_id=current_user.id, track_id=track_id).first()
    if not like:
        return jsonify({'error': 'Like not found.'}), 404

    db.session.delete(like)
    db.session.commit()
    return jsonify({'message': 'Track unliked successfully.'}), 200
