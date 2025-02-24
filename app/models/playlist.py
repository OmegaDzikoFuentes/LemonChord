from .db import db, environment, SCHEMA
from sqlalchemy.sql import func

class Playlist(db.Model):
    __tablename__ = 'playlists'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', back_populates='playlists')
    tracks = db.relationship(
        'Track',
        secondary='playlist_tracks',
        back_populates='playlists'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'tracks': [track.to_dict() for track in self.tracks]
        }
