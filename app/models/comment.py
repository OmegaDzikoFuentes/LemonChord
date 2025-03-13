from .db import db, environment, SCHEMA
from sqlalchemy.sql import func

class Comment(db.Model):
    __tablename__ = 'comments'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', back_populates='comments')
    track = db.relationship('Track', back_populates='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'user_id': self.user_id,
            'track_id': self.track_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
     }
