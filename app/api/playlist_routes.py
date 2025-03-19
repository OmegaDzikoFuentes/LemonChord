from flask import Blueprint, request
from sqlalchemy import desc, func
from app.models import Track, Like
from app.utils.errors import api_success

main_routes = Blueprint('main', __name__)

@main_routes.route('/ultimate_playlist')
def ultimate_playlist():
    # Retrieve query parameters for pagination, sorting, and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    genre_filter = request.args.get('genre')
    
    query = Track.query
    if genre_filter:
        query = query.filter(Track.genre.ilike(f"%{genre_filter}%"))
    
    if sort_by == 'likes':
        query = (
            query.outerjoin(Like)
                 .group_by(Track.id)
                 .order_by(desc(func.count(Like.user_id)))
        )
    else:
        query = query.order_by(Track.created_at.desc())
    
    paginated_tracks = query.paginate(page=page, per_page=per_page, error_out=False)
    tracks = [track.to_dict() for track in paginated_tracks.items]
    
    return api_success(data={
        'tracks': tracks,
        'pagination': {
            'page': paginated_tracks.page,
            'per_page': paginated_tracks.per_page,
            'total_pages': paginated_tracks.pages,
            'total_items': paginated_tracks.total
        }
    })
