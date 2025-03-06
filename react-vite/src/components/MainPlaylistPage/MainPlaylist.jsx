import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkFetchGlobalTracks } from "../../redux/globalTracks";
import { thunkCreateTrack } from "../../redux/userTracks";
import { thunkLikeTrack, thunkUnlikeTrack } from "../../redux/likes";
import { thunkCreateComment, thunkUpdateComment, thunkDeleteComment } from "../../redux/comments";
import { thunkCreatePlaylist } from "../../redux/playlists";
import "./MainPlaylist.css";

function MainPage() {
  const dispatch = useDispatch();
  const tracksObj = useSelector((state) => state.globalTracks);
  const tracksArray = Object.values(tracksObj);
  console.log("tracksArray:", tracksArray);
  console.log("tracksObj:", tracksObj);
  console.log("tracksArray:ssoooonnnggg", tracksArray[0]);

  // State for current playing track index.
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadDuration, setUploadDuration] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Other states (commentText, etc.) remain as before
  const [commentText, setCommentText] = useState("");

  // Fetch global tracks on component mount.
  useEffect(() => {
    dispatch(thunkFetchGlobalTracks());
  }, [dispatch]);

  useEffect(() => {
    if (tracksArray.length > 0 && audioRef.current) {
      audioRef.current.src = tracksArray[currentIndex].audio_url;
      audioRef.current.play();
    }
  }, [currentIndex, tracksArray]);

  const handleSkip = () => {
    if (tracksArray.length) {
      const nextIndex = (currentIndex + 1) % tracksArray.length;
      setCurrentIndex(nextIndex);
    }
  };

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
      // Optionally, hide the form after upload
      setShowUploadForm(false);
    }
  };

  // Handlers for like, comment, add to playlist, etc. remain unchanged.
  const handleLike = async () => {
    if (tracksArray[currentIndex]) {
      await dispatch(thunkLikeTrack(tracksArray[currentIndex].id));
    }
  };

  const handleUnlike = async () => {
    if (tracksArray[currentIndex]) {
      await dispatch(thunkUnlikeTrack(tracksArray[currentIndex].id));
    }
  };

  const handleAddToPlaylist = async () => {
    if (tracksArray[currentIndex]) {
      const playlistData = {
        name: "My Playlist",
        trackId: tracksArray[currentIndex].id,
      };
      await dispatch(thunkCreatePlaylist(playlistData));
    }
  };

  const handlePostComment = async () => {
    if (tracksArray[currentIndex] && commentText.trim()) {
      await dispatch(thunkCreateComment(tracksArray[currentIndex].id, commentText));
      setCommentText("");
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (tracksArray[currentIndex] && commentText.trim()) {
      await dispatch(thunkUpdateComment(tracksArray[currentIndex].id, commentId, commentText));
      setCommentText("");
    }
  };

  const handleDeleteComment = async (commentId) => {
    await dispatch(thunkDeleteComment(tracksArray[currentIndex].id, commentId));
  };

  return (
    <div className="main-page">
      <header className="boom-box-header">
        <h1 className="logo-banner">LEMONCHORD</h1>
      </header>
      <div className="boom-box-body">
        <div className="speaker left-speaker">
          <div className="spinning-lemons"></div>
        </div>
        <div className="tape-deck">
          <button className="skip-button" onClick={handleSkip}>
            Skip
          </button>
          <div className="song-info">
            {tracksArray[currentIndex] && (
              <>
                <h2>{tracksArray[currentIndex].title}</h2>
                <p>{tracksArray[currentIndex].genre}</p>
              </>
            )}
          </div>
          <div className="audio-player">
            <audio ref={audioRef} controls onEnded={handleSkip}>
              Your browser does not support the audio element.
            </audio>
          </div>
          <button onClick={() => setShowUploadForm(!showUploadForm)}>
            {showUploadForm ? "Hide Upload Form" : "Show Upload Form"}
          </button>
          {showUploadForm && (
            <div className="upload-slot">
              <form onSubmit={handleUpload}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
                <div>
                  <label htmlFor="title-upload">Title:</label>
                  <input
                    type="text"
                    id="title-upload"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="genre-upload">Genre:</label>
                  <input
                    type="text"
                    id="genre-upload"
                    value={uploadGenre}
                    onChange={(e) => setUploadGenre(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="duration-upload">Duration (sec):</label>
                  <input
                    type="number"
                    id="duration-upload"
                    value={uploadDuration}
                    onChange={(e) => setUploadDuration(e.target.value)}
                  />
                </div>
                <button type="submit">Upload Your Track</button>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
        <div className="speaker right-speaker">
          <div className="spinning-lemons"></div>
        </div>
      </div>
      <div className="controls">
        <button className="like-button" onClick={handleLike}>Like</button>
        <button className="unlike-button" onClick={handleUnlike}>Unlike</button>
        <button className="add-to-playlist-button" onClick={handleAddToPlaylist}>
          Add to My Playlist
        </button>
        <div className="comments-section">
          <textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          ></textarea>
          <button className="comment-button" onClick={handlePostComment}>
            Post Comment
          </button>
          <button className="update-comment-button" onClick={handleUpdateComment}>
            Update Comment
          </button>
          <button className="delete-comment-button" onClick={handleDeleteComment}>
            Delete Comment
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
