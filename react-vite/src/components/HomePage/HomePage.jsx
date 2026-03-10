// HomePage.js
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  thunkFetchUserTracks,
  thunkCreateTrack,
  thunkUpdateTrack,
  thunkDeleteTrack
} from "../../redux/userTracks";
import { thunkFetchGlobalTracks } from "../../redux/globalTracks";
import { thunkLikeTrack, thunkUnlikeTrack } from "../../redux/likes";
import { 
  thunkCreatePlaylist, 
  thunkDeleteTrackFromPlaylist,
  thunkAddTrackToPlaylist,
  thunkDeletePlaylist
 } from "../../redux/playlists";
import { thunkAuthenticate } from "../../redux/session";
import { thunkFetchPlaylists } from "../../redux/playlists";
import "./HomePage.css";

// ─── Mini Boombox Component ───────────────────────────────────────────────────
function MiniBoombox() {
  const dispatch = useDispatch();
  const tracksObj = useSelector((state) => state.globalTracks);
  const likes = useSelector((state) => state.likes);
  const tracksArray = useMemo(() => Object.values(tracksObj), [tracksObj]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const [hasAutostarted, setHasAutostarted] = useState(false);
  const audioRef = useRef(null);

  // Fetch global tracks on mount
  useEffect(() => {
    dispatch(thunkFetchGlobalTracks(1, 1000));
  }, [dispatch]);

  // Pick a random starting track once tracks load
  useEffect(() => {
    if (tracksArray.length > 0 && !hasAutostarted) {
      const randomIndex = Math.floor(Math.random() * tracksArray.length);
      setCurrentIndex(randomIndex);
    }
  }, [tracksArray, hasAutostarted]);

  // Autoplay once the random starting track is set
  useEffect(() => {
    if (tracksArray.length > 0 && audioRef.current && !hasAutostarted) {
      const currentTrack = tracksArray[currentIndex];
      if (!currentTrack) return;

      audioRef.current.src = currentTrack.audio_url;
      audioRef.current.currentTime = 0;

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasAutostarted(true);
          })
          .catch((e) => {
            // Autoplay may be blocked; silently fail — user can press play
            setHasAutostarted(true);
            console.warn("Autoplay blocked by browser:", e);
          });
      }
    }
  }, [currentIndex, tracksArray, hasAutostarted]);

  // Sync audio src when currentIndex changes AFTER initial autostart
  useEffect(() => {
    if (!hasAutostarted || tracksArray.length === 0 || !audioRef.current) return;
    const currentTrack = tracksArray[currentIndex];
    if (!currentTrack) return;

    if (audioRef.current.dataset.trackId !== `${currentTrack.id}`) {
      audioRef.current.dataset.trackId = currentTrack.id;
      const wasPlaying = isPlaying;
      audioRef.current.src = currentTrack.audio_url;
      audioRef.current.currentTime = 0;

      if (wasPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.error("Playback error:", e));
        }
      }
    }
  }, [currentIndex, tracksArray, isPlaying, hasAutostarted]);

  const handleSkip = useCallback(() => {
    if (tracksArray.length > 1) {
      setHistory((prev) => [...prev, currentIndex]);
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * tracksArray.length);
      } while (randomIndex === currentIndex);
      setCurrentIndex(randomIndex);
    }
  }, [currentIndex, tracksArray]);

  const handleBack = () => {
    if (history.length > 0) {
      const lastIndex = history[history.length - 1];
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentIndex(lastIndex);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error("Playback error:", e));
    }
  };

  // Audio event listeners
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      handleSkip();
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [handleSkip]);

  const handleLike = () => {
    if (!tracksArray[currentIndex]) return;
    dispatch(thunkLikeTrack(tracksArray[currentIndex].id));
  };

  const handleUnlike = () => {
    if (!tracksArray[currentIndex]) return;
    dispatch(thunkUnlikeTrack(tracksArray[currentIndex].id));
  };

  const currentTrack = tracksArray[currentIndex];
  const isLiked = currentTrack && likes[currentTrack.id];

  return (
    <div className="mini-boombox">
      <div className="mini-boombox-inner">
        {/* Left decorative speaker */}
        <div className="mini-speaker mini-speaker-left">
          <div className="mini-speaker-grill">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="mini-speaker-dot" />
            ))}
          </div>
        </div>

        {/* Center player */}
        <div className="mini-player-center">
          <div className="mini-cassette">
            <div className={`mini-cassette-reel ${isPlaying ? "spinning" : ""}`} />
            <div className="mini-cassette-label">
              {currentTrack ? (
                <>
                  <p className="mini-track-title">{currentTrack.title}</p>
                  <p className="mini-track-artist">{currentTrack.artist_name || "Unknown Artist"}</p>
                  <p className="mini-track-genre">{currentTrack.genre}</p>
                </>
              ) : (
                <p className="mini-track-title">Loading...</p>
              )}
            </div>
            <div className={`mini-cassette-reel ${isPlaying ? "spinning" : ""}`} />
          </div>

          {/* Hidden native audio element */}
          <audio ref={audioRef} style={{ display: "none" }} />

          {/* Controls */}
          <div className="mini-controls">
            <button
              className="mini-btn mini-btn-back"
              onClick={handleBack}
              disabled={history.length === 0}
              title="Go Back"
            >
              ⏮
            </button>
            <button
              className="mini-btn mini-btn-playpause"
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              className="mini-btn mini-btn-skip"
              onClick={handleSkip}
              title="Skip"
            >
              ⏭
            </button>
            <button
              className={`mini-btn mini-btn-like ${isLiked ? "liked" : ""}`}
              onClick={isLiked ? handleUnlike : handleLike}
              title={isLiked ? "Unlike" : "Like"}
            >
              🍋 {currentTrack?.like_count || 0}
            </button>
          </div>
        </div>

        {/* Right decorative speaker */}
        <div className="mini-speaker mini-speaker-right">
          <div className="mini-speaker-grill">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="mini-speaker-dot" />
            ))}
          </div>
        </div>
      </div>

      {/* Now Playing ticker */}
      <div className="mini-ticker-wrap">
        <div className="mini-ticker">
          {currentTrack
            ? `🎵 NOW PLAYING: ${currentTrack.title} by ${currentTrack.artist_name || "Unknown"} · ${currentTrack.genre} · ${currentTrack.like_count || 0} Lemons`
            : "🎵 LEMONCHORD RADIO — Loading tracks..."}
        </div>
      </div>
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────
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
  const [uploadArtist, setUploadArtist] = useState("");
  const [errors, setErrors] = useState({});

  // State for editing a track
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editArtist, setEditArtist] = useState("");

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
    setErrors({});
    
    const newErrors = {};
    if (!uploadFile) newErrors.audio_file = "Audio file is required";
    if (!uploadTitle.trim()) newErrors.title = "Title is required";
    if (!uploadGenre.trim()) newErrors.genre = "Genre is required";
    if (!uploadDuration || uploadDuration < 10) newErrors.duration = "Duration must be at least 10 seconds";
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("audio_file", uploadFile);
      formData.append("title", uploadTitle || "New Track");
      formData.append("genre", uploadGenre || "Unknown");
      formData.append("duration", uploadDuration || 180);
      formData.append("artist_name", uploadArtist || ""); 

      setTimeout(() => setUploadProgress(50), 500);
      setTimeout(() => setUploadProgress(80), 1000);
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      
      const result = await dispatch(thunkCreateTrack(formData));
  
      if (result?.errors) {
        setErrors(result.errors);
      } else {
        setUploadFile(null);
        setUploadTitle("");
        setUploadGenre("");
        setUploadDuration("");
        setUploadArtist("");
      }
    } catch (error) {
      setErrors({ server: "Error uploading track" });
    } finally {
      setUploadProgress(0);
    }
  };

  const handleDelete = (trackId) => {
    dispatch(thunkDeleteTrack(trackId));
  };

  const handleDeleteFromPlaylist = async (playlistId, trackId) => {
    await dispatch(thunkDeleteTrackFromPlaylist(playlistId, trackId));
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      await dispatch(thunkDeletePlaylist(playlistId));
    }
  };

  const handleCreatePlaylist = async () => {
    const name = prompt("Enter playlist name:", "My Playlist");
    if (name === null) return;
    const cleanName = name.trim() || "My Playlist";
    const exists = playlistsArray.some(playlist => 
      playlist.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      alert("Playlist name already exists! Please choose a different name.");
      return;
    }
    const playlistData = { name: cleanName };
    const result = await dispatch(thunkCreatePlaylist(playlistData));
    if (result && result.data) {
      alert(`New playlist created: ${cleanName}`);
    }
  };

  const handleAddTrackToPlaylist = async (trackId) => {
    if (playlistsArray.length === 0) {
      const name = prompt("Enter playlist name:", "My Playlist");
      if (name === null) return;
      const cleanName = name.trim() || "My Playlist";
      const playlistData = { name: cleanName, trackId };
      await dispatch(thunkCreatePlaylist(playlistData));
      alert(`New playlist created: ${cleanName}`);
      return;
    }
    
    const options = ["Create New Playlist"];
    playlistsArray.forEach(playlist => {
      options.push(`Add to: ${playlist.name}`);
    });
    
    const selection = prompt(
      `Select an option (enter number 1-${options.length}):\n` +
      options.map((opt, i) => `${i+1}. ${opt}`).join('\n')
    );
    
    if (!selection) return;
    const selectedIndex = parseInt(selection) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      alert("Invalid selection");
      return;
    }
    
    if (selectedIndex === 0) {
      const name = prompt("Enter playlist name:", "My Playlist");
      if (name === null) return;
      const cleanName = name.trim() || "My Playlist";
      const exists = playlistsArray.some(playlist => 
        playlist.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (exists) {
        alert("Playlist name already exists! Please choose a different name.");
        return;
      }
      await dispatch(thunkCreatePlaylist({ name: cleanName, trackId }));
      alert(`New playlist created: ${cleanName}`);
    } else {
      const selectedPlaylist = playlistsArray[selectedIndex - 1];
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
    setEditArtist(track.artist_name || "");
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
    formData.append("artist_name", editArtist);
    await dispatch(thunkUpdateTrack(trackId, formData));
    cancelEditing();
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Welcome to LemonChord Radio</h1>
      </header>

      {/* ── Mini Boombox Player ── always visible, autoplays on load */}
      <MiniBoombox />

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
                                {track.artist_name && <span className="track-artist"> by {track.artist_name}</span>}
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
              {errors.title && <p className="error">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="artist_name">Artist:</label>
              <input
                type="text"
                id="artist_name"
                value={uploadArtist}
                onChange={(e) => setUploadArtist(e.target.value)}
              />
              {errors.artist_name && <p className="error">{errors.artist_name}</p>}
            </div>
            <div>
              <label htmlFor="genre">Genre:</label>
              <input
                type="text"
                id="genre"
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value)}
              />
              {errors.genre && <p className="error">{errors.genre}</p>}
            </div>
            <div>
              <label htmlFor="duration">Duration (seconds):</label>
              <input
                type="number"
                id="duration"
                value={uploadDuration}
                onChange={(e) => setUploadDuration(e.target.value)}
              />
              {errors.duration && <p className="error">{errors.duration}</p>}
            </div>
            <div>
              <label htmlFor="audio_file">Audio File:</label>
              <input
                type="file"
                id="audio_file"
                accept=".mp3,.wav,.ogg,.flac,.m4a,.aac,.3gp,.wma,.aiff,.alac,.mp4,.webm,.caf"
                onChange={handleFileChange}
              />
              {errors.audio_file && <p className="error">{errors.audio_file}</p>}
              <small className="file-format-help">
                Supported formats: MP3, WAV, M4A, AAC and more. 
                iPhone users: Please use M4A or AAC format for best results.
              </small>
            </div>
            {errors.server && <p className="error">{errors.server}</p>}
            <button 
              type="submit" 
              disabled={uploadProgress > 0}
            >
              Upload Song
            </button>
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
                    <strong>{track.title}</strong> 
                    {track.artist_name && <span> by {track.artist_name}</span>} 
                         – {track.genre}
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
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder="Genre"
                    />
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      placeholder="Artist Name"
                    />
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      placeholder="Duration"
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