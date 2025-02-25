from .db import db, environment, SCHEMA

playlist_tracks = db.Table(
    'playlist_tracks',
    db.Column('playlist_id', db.Integer, db.ForeignKey('playlists.id'), primary_key=True),
    db.Column('track_id', db.Integer, db.ForeignKey('tracks.id'), primary_key=True),
    schema=SCHEMA if environment == "production" else None
)
