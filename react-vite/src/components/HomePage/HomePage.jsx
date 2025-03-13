// HomePage.js
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  thunkFetchUserTracks,
  thunkCreateTrack,
  thunkUpdateTrack,
  thunkDeleteTrack
} from "../../redux/userTracks";
import { 
  thunkCreatePlaylist, 
  thunkDeleteTrackFromPlaylist,
  thunkAddTrackToPlaylist,
  thunkDeletePlaylist
 } from "../../redux/playlists";
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

  // Remove a track from a given playlist
  const handleDeleteFromPlaylist = async (playlistId, trackId) => {
    await dispatch(thunkDeleteTrackFromPlaylist(playlistId, trackId));
  };

  // Delete a given playlist
  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      await dispatch(thunkDeletePlaylist(playlistId));
    }
  };

  // Create a new playlist with a custom name
  const handleCreatePlaylist = async () => {
    // Prompt user for playlist name
    const name = prompt("Enter playlist name:", "My Playlist");
    
    // Exit if user cancels the prompt
    if (name === null) return;
    
    // Use provided name or default to "My Playlist" if empty
    const cleanName = name.trim() || "My Playlist";
    
    // Check for duplicates
    const exists = playlistsArray.some(playlist => 
      playlist.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
      alert("Playlist name already exists! Please choose a different name.");
      return;
    }

    // Create the playlist
    const playlistData = { name: cleanName };
    const result = await dispatch(thunkCreatePlaylist(playlistData));
    
    if (result && result.data) {
      // Optional: Give feedback to the user
      alert(`New playlist created: ${cleanName}`);
    }
  };

  // Add a track to a playlist
  const handleAddTrackToPlaylist = async (trackId) => {
    // If no playlists yet, create one directly
    if (playlistsArray.length === 0) {
      const name = prompt("Enter playlist name:", "My Playlist");
      
      // Exit if user cancels the prompt
      if (name === null) return;
      
      const cleanName = name.trim() || "My Playlist";
      
      const playlistData = {
        name: cleanName,
        trackId: trackId, // Include track ID in the creation
      };
        
      await dispatch(thunkCreatePlaylist(playlistData));
      alert(`New playlist created: ${cleanName}`);
      return;
    }
    
    // Build options for playlist selection
    const options = ["Create New Playlist"];
    
    // Add existing playlists to options
    playlistsArray.forEach(playlist => {
      options.push(`Add to: ${playlist.name}`);
    });
    
    // Let user select from options
    const selection = prompt(
      `Select an option (enter number 1-${options.length}):\n` +
      options.map((opt, i) => `${i+1}. ${opt}`).join('\n')
    );
    
    if (!selection) return; // User canceled
    
    const selectedIndex = parseInt(selection) - 1;
    
    // Validate selection
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      alert("Invalid selection");
      return;
    }
    
    // Handle creating new playlist
    if (selectedIndex === 0) {
      const name = prompt("Enter playlist name:", "My Playlist");
      
      // Exit if user cancels the prompt
      if (name === null) return;
      
      const cleanName = name.trim() || "My Playlist";
      
      // Check for duplicates
      const exists = playlistsArray.some(playlist => 
        playlist.name.toLowerCase() === cleanName.toLowerCase()
      );
  
      if (exists) {
        alert("Playlist name already exists! Please choose a different name.");
        return;
      }
  
      const playlistData = {
        name: cleanName,
        trackId: trackId,
      };
        
      await dispatch(thunkCreatePlaylist(playlistData));
      alert(`New playlist created: ${cleanName}`);
    } 
    // Handle adding to existing playlist
    else {
      const playlistIndex = selectedIndex - 1;
      const selectedPlaylist = playlistsArray[playlistIndex];
      
      // Check if track is already in the playlist
      const trackAlreadyInPlaylist = selectedPlaylist.tracks?.some(track => track.id === trackId);
      
      if (trackAlreadyInPlaylist) {
        alert("This track is already in the selected playlist!");
        return;
      }
      
      await dispatch(thunkAddTrackToPlaylist(selectedPlaylist.id, trackId));
      alert(`Track added to playlist: ${selectedPlaylist.name}`);
    }
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
                    <div className="playlist-header">
                      <h3>{playlist.name}</h3>
                      <button 
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="delete-playlist-btn"
                      >
                        Delete Playlist
                      </button>
                    </div>
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
                    <button onClick={() => handleAddTrackToPlaylist(track.id)}>Add to Playlist</button>
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