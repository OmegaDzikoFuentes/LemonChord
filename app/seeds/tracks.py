from app.models import db, Track, environment, SCHEMA
from sqlalchemy.sql import text

def seed_tracks():
    # Assuming users with IDs 1, 2, and 3 exist
    tracks = [
        Track(
            title="Sample Track 1",
            audio_url="https://example.com/audio1.mp3",
            user_id=1,
            duration=210,
            genre="Pop"
        ),
        Track(
            title="Sample Track 2",
            audio_url="https://example.com/audio2.mp3",
            user_id=2,
            duration=180,
            genre="Rock"
        ),
        Track(
            title="Sample Track 3",
            audio_url="https://example.com/audio3.mp3",
            user_id=3,
            duration=240,
            genre="Jazz"
        ),
        # Additional tracks:
        Track(
            title="Extra Track 4",
            audio_url="https://example.com/audio4.mp3",
            user_id=1,
            duration=200,
            genre="Pop"
        ),
        Track(
            title="Extra Track 5",
            audio_url="https://example.com/audio5.mp3",
            user_id=1,
            duration=230,
            genre="Electro"
        ),
        Track(
            title="Extra Track 6",
            audio_url="https://example.com/audio6.mp3",
            user_id=2,
            duration=190,
            genre="Rock"
        ),
        Track(
            title="Extra Track 7",
            audio_url="https://example.com/audio7.mp3",
            user_id=2,
            duration=220,
            genre="Indie"
        ),
        Track(
            title="Extra Track 8",
            audio_url="https://example.com/audio8.mp3",
            user_id=3,
            duration=250,
            genre="Jazz"
        ),
        Track(
            title="Extra Track 9",
            audio_url="https://example.com/audio9.mp3",
            user_id=3,
            duration=205,
            genre="Blues"
        ),
    ]

    db.session.add_all(tracks)
    db.session.commit()

def undo_tracks():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.tracks RESTART IDENTITY CASCADE;")
    else:
        from sqlalchemy.sql import text
        db.session.execute(text("DELETE FROM tracks"))
    db.session.commit()
