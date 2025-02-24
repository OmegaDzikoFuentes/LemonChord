from .db import db, environment, SCHEMA
from sqlalchemy.sql import func

class Like(db.Model):
    __tablename__ = 'likes'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}
    else:
        __table_args__ = (
            db.PrimaryKeyConstraint('user_id', 'track_id'),
        )

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', back_populates='likes')
    track = db.relationship('Track', back_populates='likes')

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'track_id': self.track_id,
            'created_at': self.created_at
        }
