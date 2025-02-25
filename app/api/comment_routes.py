from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.models import db, Comment, Track

comments_routes = Blueprint('comments', __name__)

# Create a new comment on a track
@comments_routes.route('/tracks/<int:track_id>/comments', methods=['POST'])
@login_required
def create_comment(track_id):
    track = Track.query.get_or_404(track_id)
    data = request.get_json() or {}
    text = data.get('text')
    if not text:
        return jsonify({'error': 'Comment text is required.'}), 400

    comment = Comment(
        text=text,
        user_id=current_user.id,
        track_id=track_id
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

# List all comments for a track
@comments_routes.route('/tracks/<int:track_id>/comments', methods=['GET'])
def list_comments(track_id):
    track = Track.query.get_or_404(track_id)
    comments = track.comments  # Assuming Track model has a relationship named 'comments'
    return jsonify([comment.to_dict() for comment in comments]), 200

# Update a comment (only by the comment owner)
@comments_routes.route('/comments/<int:comment_id>', methods=['PUT', 'PATCH'])
@login_required
def update_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        abort(403)
    data = request.get_json() or {}
    if 'text' in data:
        comment.text = data['text']
    db.session.commit()
    return jsonify(comment.to_dict()), 200

# Delete a comment (only by the comment owner)
@comments_routes.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        abort(403)
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted successfully.'}), 200
