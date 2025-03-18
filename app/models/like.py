from .db import db, environment, SCHEMA, add_prefix_for_prod
from sqlalchemy.sql import func

class Like(db.Model):
    __tablename__ = 'likes'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}
    
    # Make these primary keys in all environments
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), 
                       nullable=False, primary_key=True)
    track_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('tracks.id')), 
                        nullable=False, primary_key=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', back_populates='likes')
    track = db.relationship('Track', back_populates='likes')

    def to_dict(self):
        return {
            'id': f"{self.user_id}_{self.track_id}",  # Composite string identifier
            'user_id': self.user_id,
            'track_id': self.track_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }