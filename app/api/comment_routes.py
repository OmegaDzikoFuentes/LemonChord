from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.models import db, Comment, Track
from sqlalchemy.orm import joinedload

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
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)  # Default to 10 comments per page

    track = Track.query.options(joinedload(Track.comments)).get_or_404(track_id)
    paginated_comments = Comment.query.filter_by(track_id=track_id).paginate(page=page, per_page=per_page, error_out=False)

    comments = [comment.to_dict() for comment in paginated_comments.items]

    return jsonify({
        'comments': comments,
        'pagination': {
            'page': paginated_comments.page,
            'per_page': paginated_comments.per_page,
            'total_pages': paginated_comments.pages,
            'total_items': paginated_comments.total
        }
    }), 200

# Update a comment (only by the comment owner)
@comments_routes.route('/comments/<int:comment_id>', methods=['PUT', 'PATCH'])
@login_required
def update_comment(comment_id):
    # Check ownership BEFORE querying
    comment = Comment.query.filter_by(id=comment_id, user_id=current_user.id).first_or_404()
    data = request.get_json() or {}
    if 'text' in data:
        comment.text = data['text']
    db.session.commit()
    return jsonify(comment.to_dict()), 200

# Delete a comment (only by the comment owner)
@comments_routes.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    # Check ownership BEFORE querying
    comment = Comment.query.filter_by(id=comment_id, user_id=current_user.id).first_or_404()
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted successfully.'}), 200