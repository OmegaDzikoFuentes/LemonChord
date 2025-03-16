from flask import Blueprint
from flask_login import current_user, login_required
from sqlalchemy import func
from app.models import db, Like, Track
from app.utils.errors import api_success, ValidationError, ResourceNotFoundError

likes_routes = Blueprint('likes', __name__)

# Like a track
@likes_routes.route('/tracks/<int:track_id>/like', methods=['POST'])
@login_required
def like_track(track_id):
    track = Track.query.get(track_id)
    if not track:
        raise ResourceNotFoundError("Track")
    
    existing_like = Like.query.filter_by(user_id=current_user.id, track_id=track_id).first()
    if existing_like:
        raise ValidationError("Track already liked")
    
    like = Like(user_id=current_user.id, track_id=track_id)
    db.session.add(like)
    db.session.commit()
    
    # Compute like count dynamically
    like_count = db.session.query(func.count(Like.track_id))\
                           .filter(Like.track_id == track_id).scalar()
    
    return api_success(
        message="Track liked successfully",
        data={'like_id': like.to_dict()['id'], 'like_count': like_count},
        status_code=201
    )

# Unlike a track
@likes_routes.route('/tracks/<int:track_id>/like', methods=['DELETE'])
@login_required
def unlike_track(track_id):
    track = Track.query.get(track_id)
    if not track:
        raise ResourceNotFoundError("Track")
    
    like = Like.query.filter_by(user_id=current_user.id, track_id=track_id).first()
    if not like:
        raise ResourceNotFoundError("Like")
    
    db.session.delete(like)
    db.session.commit()
    
    # Compute like count dynamically
    like_count = db.session.query(func.count(Like.track_id))\
                           .filter(Like.track_id == track_id).scalar()
    
    return api_success(
        message="Track unliked successfully",
        data={'like_count': like_count},
        status_code=200
    )


# Get current user's likes (unchanged)
@likes_routes.route('/current', methods=['GET'])
@login_required
def get_user_likes():
    likes = Like.query.filter_by(user_id=current_user.id).all()
    return api_success(data={'likes': [like.to_dict() for like in likes]})


