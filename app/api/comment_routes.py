from flask import Blueprint, request
from flask_login import current_user, login_required
from app.models import db, Comment, Track
from app.utils.errors import api_success, ValidationError, ResourceNotFoundError

comments_routes = Blueprint('comments', __name__)

# Create a new comment on a track
@comments_routes.route('/tracks/<int:track_id>/comments', methods=['POST'])
@login_required
def create_comment(track_id):
    track = Track.query.get(track_id)
    if not track:
        raise ResourceNotFoundError("Track")
    
    data = request.get_json() or {}
    text = data.get('text')
    if not text:
        raise ValidationError("Comment text is required", errors={"text": "Required field"})
    
    comment = Comment(text=text, user_id=current_user.id, track_id=track_id)
    db.session.add(comment)
    db.session.commit()
    return api_success(data=comment.to_dict(), message="Comment created", status_code=201)

# List all comments for a track
@comments_routes.route('/tracks/<int:track_id>/comments', methods=['GET'])
def list_comments(track_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    track = Track.query.get(track_id)
    if not track:
        raise ResourceNotFoundError("Track")
    
    paginated_comments = Comment.query.filter_by(track_id=track_id).paginate(page=page, per_page=per_page, error_out=False)
    comments = [comment.to_dict() for comment in paginated_comments.items]
    
    return api_success(data={
        'comments': comments,
        'pagination': {
            'page': paginated_comments.page,
            'per_page': paginated_comments.per_page,
            'total_pages': paginated_comments.pages,
            'total_items': paginated_comments.total
        }
    })

# Update a comment (only by the comment owner)
@comments_routes.route('/comments/<int:comment_id>', methods=['PUT', 'PATCH'])
@login_required
def update_comment(comment_id):
    comment = Comment.query.filter_by(id=comment_id, user_id=current_user.id).first()
    if not comment:
        raise ResourceNotFoundError("Comment")
    
    data = request.get_json() or {}
    if 'text' in data:
        comment.text = data['text']
    db.session.commit()
    return api_success(data=comment.to_dict(), message="Comment updated", status_code=200)

# Delete a comment (only by the comment owner)
@comments_routes.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.filter_by(id=comment_id, user_id=current_user.id).first()
    if not comment:
        raise ResourceNotFoundError("Comment")
    
    db.session.delete(comment)
    db.session.commit()
    return api_success(message="Comment deleted successfully")
