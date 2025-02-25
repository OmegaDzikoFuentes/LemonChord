from app.models import db, Like, environment, SCHEMA
from sqlalchemy.sql import text

def seed_likes():
    # Assuming users with IDs 1, 2, and 3 exist and tracks with IDs 1, 2, and 3 exist as well
    like1 = Like(user_id=1, track_id=1)
    like2 = Like(user_id=2, track_id=1)
    like3 = Like(user_id=3, track_id=1)
    like4 = Like(user_id=1, track_id=2)
    like5 = Like(user_id=2, track_id=3)
    like6 = Like(user_id=3, track_id=2)
    
    db.session.add_all([like1, like2, like3, like4, like5, like6])
    db.session.commit()

def undo_likes():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
    db.session.commit()
