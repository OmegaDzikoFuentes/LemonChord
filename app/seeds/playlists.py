from app.models import db, Playlist, Track, environment, SCHEMA
from sqlalchemy.sql import text

def seed_playlists():
    # Create one playlist per user
    playlist1 = Playlist(name="Demo's Ultimate Playlist", user_id=1)
    playlist2 = Playlist(name="Marnie's Hits", user_id=2)
    playlist3 = Playlist(name="Bobbie's Favorites", user_id=3)

    # Add tracks to each playlist.
    # We assume that track IDs 1 to 9 have been assigned from the tracks seeder.
    # You can adjust the selection of track IDs as desired.
    demo_tracks = [1, 4, 7]
    marnie_tracks = [2, 5, 8]
    bobbie_tracks = [3, 6, 9]

    for tid in demo_tracks:
        track = Track.query.get(tid)
        if track:
            playlist1.tracks.append(track)

    for tid in marnie_tracks:
        track = Track.query.get(tid)
        if track:
            playlist2.tracks.append(track)

    for tid in bobbie_tracks:
        track = Track.query.get(tid)
        if track:
            playlist3.tracks.append(track)

    db.session.add_all([playlist1, playlist2, playlist3])
    db.session.commit()

def undo_playlists():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.playlists RESTART IDENTITY CASCADE;")
    else:
        from sqlalchemy.sql import text
        db.session.execute(text("DELETE FROM playlists"))
    db.session.commit()
