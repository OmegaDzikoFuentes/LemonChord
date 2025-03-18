from .db import db, environment, SCHEMA, add_prefix_for_prod
from sqlalchemy.sql import func
from .associations import playlist_tracks

class Playlist(db.Model):
    __tablename__ = 'playlists'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', back_populates='playlists')
    tracks = db.relationship(
        'Track',
        secondary=playlist_tracks,
        back_populates='playlists'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'tracks': [track.to_dict() for track in self.tracks]
        }
