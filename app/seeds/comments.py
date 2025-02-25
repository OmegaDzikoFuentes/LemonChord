from app.models import db, Comment, environment, SCHEMA
from sqlalchemy.sql import text

def seed_comments():
    # Create sample comments.
    # Ensure that the users and tracks referenced (user_id and track_id) already exist.
    comment1 = Comment(
        text="Amazing track! Love the energy.",
        user_id=1,
        track_id=1
    )
    comment2 = Comment(
        text="This song is on repeat for me.",
        user_id=2,
        track_id=1
    )
    comment3 = Comment(
        text="Great vibe and production quality.",
        user_id=3,
        track_id=2
    )
    comment4 = Comment(
        text="Not my style, but it's cool!",
        user_id=1,
        track_id=3
    )
    comment5 = Comment(
        text="I really enjoy this track, awesome work!",
        user_id=2,
        track_id=3
    )
    comment6 = Comment(
        text="Could use some improvement, but I like it.",
        user_id=3,
        track_id=2
    )

    db.session.add_all([comment1, comment2, comment3, comment4, comment5, comment6])
    db.session.commit()

def undo_comments():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.comments RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM comments"))
    db.session.commit()
