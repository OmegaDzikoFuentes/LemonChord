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
    artist_name = db.Column(db.String(255))
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    # Add these relationship declarations
    user = db.relationship('User', back_populates='tracks')
    comments = db.relationship('Comment', back_populates='track')
    likes = db.relationship('Like', back_populates='track')
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
            'artist_name': self.artist_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'like_count': len(self.likes)
         }