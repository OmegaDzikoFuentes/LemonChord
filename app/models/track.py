from .db import db, environment, SCHEMA
from sqlalchemy.sql import func


class Track(db.Model):
    __tablename__ = 'tracks'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    audio_url = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    duration = db.Column(db.Integer)
    genre = db.Column(db.String(255))
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', back_populates='tracks')
    comments = db.relationship('Comment', back_populates='track', cascade='all, delete-orphan')
    likes = db.relationship('Like', back_populates='track', cascade='all, delete-orphan')
    playlists = db.relationship(
        'Playlist',
        secondary='playlist_tracks',
        back_populates='tracks'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'audio_url': self.audio_url,
            'user_id': self.user_id,
            'duration': self.duration,
            'genre': self.genre,
            'created_at': self.created_at
        }
