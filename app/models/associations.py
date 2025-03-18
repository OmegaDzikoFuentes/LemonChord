from .db import db, environment, SCHEMA, add_prefix_for_prod

playlist_tracks = db.Table(
    'playlist_tracks',
    db.Column('playlist_id', db.Integer, db.ForeignKey(add_prefix_for_prod('playlists.id')), primary_key=True),
    db.Column('track_id', db.Integer, db.ForeignKey(add_prefix_for_prod('tracks.id')), primary_key=True),
    schema=SCHEMA if environment == "production" else None
)
