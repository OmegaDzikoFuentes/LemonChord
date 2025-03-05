import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkFetchUserTracks, thunkCreateTrack } from "../../redux/tracks";
import { thunkCreatePlaylist } from "../../redux/playlists";
import "./HomePage.css";

function HomePage() {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.session.user);
  const tracksObj = useSelector((state) => state.tracks);
  // Convert tracksObj to an array
  const tracksArray = Object.values(tracksObj);
  // Filter to get only the tracks uploaded by the current user
  const userTracks = sessionUser
    ? tracksArray.filter(
        (track) => Number(track.user_id) === Number(sessionUser.id)
      )
    : [];
  
  // Get playlists and filter by current user
  const playlistsObj = useSelector((state) => state.playlists);
  const userPlaylists = sessionUser
    ? Object.values(playlistsObj).filter(
        (playlist) => playlist.user_id === sessionUser.id
      )
    : [];

  // Local state for upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadDuration, setUploadDuration] = useState("");

  // Fetch tracks on component mount
useEffect(() => {
  // Fetch only the current user's tracks
  dispatch(thunkFetchUserTracks());
}, [dispatch]);

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploadFile) {
      const formData = new FormData();
      formData.append("audio_file", uploadFile);
      formData.append("title", uploadTitle || "New Track");
      formData.append("genre", uploadGenre || "Unknown");
      formData.append("duration", uploadDuration || 180);
      await dispatch(thunkCreateTrack(formData));
      // Clear form fields after upload
      setUploadFile(null);
      setUploadTitle("");
      setUploadGenre("");
      setUploadDuration("");
    }
  };

  const handleCreatePlaylist = async () => {
    // For simplicity, create a new playlist with a default name.
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
            {userPlaylists.length ? (
              <ul>
                {userPlaylists.map((pl) => (
                  <li key={pl.id}>{pl.name}</li>
                ))}
              </ul>
            ) : (
              <p>You have not created any playlists yet.</p>
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
          </form>
        ) : (
          <p>Sign in to upload your songs.</p>
        )}
      </section>

      {/* My Songs Section */}
      <section className="user-songs-section">
        <h2>My Songs</h2>
        {sessionUser ? (
          userTracks.length ? (
            <ul>
              {userTracks.map((track) => (
                <li key={track.id}>
                  <div>
                    <strong>{track.title}</strong> – {track.genre}
                  </div>
                  {/* Audio player for each track */}
                  <audio controls src={track.audio_url}>
                    Your browser does not support the audio element.
                  </audio>
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
