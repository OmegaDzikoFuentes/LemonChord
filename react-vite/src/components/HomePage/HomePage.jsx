// HomePage.js
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  thunkFetchUserTracks,
  thunkCreateTrack,
  thunkUpdateTrack,
  thunkDeleteTrack
} from "../../redux/userTracks";
import { thunkCreatePlaylist, thunkDeleteTrackFromPlaylist } from "../../redux/playlists";
import { thunkAuthenticate } from "../../redux/session";
import { thunkFetchPlaylists } from "../../redux/playlists";
import "./HomePage.css";

function HomePage() {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.session.user);
  const tracksObj = useSelector((state) => state.userTracks);
  const playlistsObj = useSelector((state) => state.playlists);
  const tracksArray = Object.values(tracksObj);
  const playlistsArray = Object.values(playlistsObj);
  
  // Local state for upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadDuration, setUploadDuration] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // State for editing a track
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editDuration, setEditDuration] = useState("");

  // Fetch session and user tracks on component mount.
  useEffect(() => {
    dispatch(thunkAuthenticate());
  }, [dispatch]);

  useEffect(() => {
    if (sessionUser) {
      dispatch(thunkFetchUserTracks());
      dispatch(thunkFetchPlaylists()); 
    }
  }, [dispatch, sessionUser]);

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploadFile) {
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("audio_file", uploadFile);
      formData.append("title", uploadTitle || "New Track");
      formData.append("genre", uploadGenre || "Unknown");
      formData.append("duration", uploadDuration || 180);

      setTimeout(() => setUploadProgress(50), 500);
      setTimeout(() => setUploadProgress(80), 1000);

      await dispatch(thunkCreateTrack(formData));
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      
      setUploadFile(null);
      setUploadTitle("");
      setUploadGenre("");
      setUploadDuration("");
    }
  };

  const handleDelete = (trackId) => {
    dispatch(thunkDeleteTrack(trackId));
  };

  // Example: Remove a track from a given playlist
  const handleDeleteFromPlaylist = async (playlistId, trackId) => {
    await dispatch(thunkDeleteTrackFromPlaylist(playlistId, trackId));
  };

  const startEditing = (track) => {
    setEditingTrackId(track.id);
    setEditTitle(track.title);
    setEditGenre(track.genre);
    setEditDuration(track.duration);
  };

  const cancelEditing = () => {
    setEditingTrackId(null);
    setEditTitle("");
    setEditGenre("");
    setEditDuration("");
  };

  const handleUpdate = async (trackId) => {
    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("genre", editGenre);
    formData.append("duration", editDuration);
    await dispatch(thunkUpdateTrack(trackId, formData));
    cancelEditing();
  };

  const handleCreatePlaylist = async () => {
    const playlistData = { name: "My Playlist" };
    await dispatch(thunkCreatePlaylist(playlistData));
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Welcome to LemonChord</h1>
      </header>
      
      {/* My Playlists Section */}
      <section className="playlist-section">
        <h2>My Playlists</h2>
        {sessionUser ? (
          <>
            {playlistsArray.length > 0 ? (
              <ul>
                {playlistsArray.map(playlist => (
                  <li key={playlist.id}>
                    <h3>{playlist.name}</h3>
                    {playlist.tracks && playlist.tracks.length > 0 ? (
  <ul className="playlist-tracks">
    {playlist.tracks.map(track => (
      <li key={track.id} className="playlist-track-item">
        <div className="track-info">
          <span className="track-title">{track.title}</span>
          <span className="track-genre">{track.genre}</span>
        </div>
        <audio controls src={track.audio_url} className="track-player">
          Your browser does not support the audio element.
        </audio>
        <button 
          onClick={() => handleDeleteFromPlaylist(playlist.id, track.id)}
          className="remove-track-btn"
        >
          Remove from Playlist
        </button>
      </li>
    ))}
  </ul>
) : (
  <p>No tracks in this playlist.</p>
)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No playlists yet.</p>
            )}
            <button onClick={handleCreatePlaylist}>Create New Playlist</button>
          </>
        ) : (
          <p>Sign in to manage your playlists.</p>
        )}
      </section>

      {/* Upload Song Section */}
      <section className="upload-section">
        <h2>Upload a Song</h2>
        {sessionUser ? (
          <form onSubmit={handleUpload}>
            <div>
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="genre">Genre:</label>
              <input
                type="text"
                id="genre"
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="duration">Duration (seconds):</label>
              <input
                type="number"
                id="duration"
                value={uploadDuration}
                onChange={(e) => setUploadDuration(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="audio_file">Audio File:</label>
              <input
                type="file"
                id="audio_file"
                accept="audio/*"
                onChange={handleFileChange}
              />
            </div>
            <button type="submit">Upload Song</button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </form>
        ) : (
          <p>Sign in to upload your songs.</p>
        )}
      </section>

      {/* My Songs Section */}
      <section className="user-songs-section">
        <h2>My Songs</h2>
        {sessionUser ? (
          tracksArray.length ? (
            <ul>
              {tracksArray.map((track) => (
                <li key={track.id}>
                  <div>
                    <strong>{track.title}</strong> – {track.genre}
                  </div>
                  <audio controls src={track.audio_url}>
                    Your browser does not support the audio element.
                  </audio>
                  <div className="track-controls">
                    <button onClick={() => handleDelete(track.id)}>Delete</button>
                    <button onClick={() => startEditing(track)}>Update</button>
                  </div>
                  {editingTrackId === track.id && (
                    <div className="update-form">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <input
                        type="text"
                        value={editGenre}
                        onChange={(e) => setEditGenre(e.target.value)}
                      />
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                      />
                      <button onClick={() => handleUpdate(track.id)}>Submit Update</button>
                      <button onClick={cancelEditing}>Cancel</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>You have not uploaded any songs yet.</p>
          )
        ) : (
          <p>Sign in to view your uploaded songs.</p>
        )}
      </section>
    </div>
  );
}

export default HomePage;
