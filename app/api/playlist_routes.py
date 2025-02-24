from flask import render_template, Blueprint, request
from sqlalchemy import desc, func
from app.models import Track, Like

main_routes = Blueprint('main', __name__)

@main_routes.route('/')
def ultimate_playlist():
    # Retrieve query parameters for pagination, sorting, and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    sort_by = request.args.get('sort_by', 'created_at')  # default sort by created_at
    genre_filter = request.args.get('genre')  # optional filter by genre

    query = Track.query

    # Apply filtering if a genre filter is provided
    if genre_filter:
        query = query.filter(Track.genre.ilike(f"%{genre_filter}%"))

    # Apply sorting
    if sort_by == 'likes':
        # Sort tracks by the number of likes (using an outer join so that tracks with no likes are included)
        query = (
            query.outerjoin(Like)
                 .group_by(Track.id)
                 .order_by(desc(func.count(Like.user_id)))
        )
    else:
        # Default: sort by created_at (most recent first)
        query = query.order_by(Track.created_at.desc())

    # Apply pagination
    paginated_tracks = query.paginate(page=page, per_page=per_page, error_out=False)

    return render_template(
        'ultimate_playlist.html',
        tracks=paginated_tracks.items,
        pagination=paginated_tracks
    )
