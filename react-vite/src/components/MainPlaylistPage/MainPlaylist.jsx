import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkFetchTracks, thunkCreateTrack } from "../../redux/tracks";
import { thunkLikeTrack, thunkUnlikeTrack } from "../../redux/likes";
import { thunkCreateComment, thunkUpdateComment, thunkDeleteComment } from "../../redux/comments";
import { thunkCreatePlaylist } from "../../redux/playlists";

import "./MainPlaylist.css";

function MainPage() {
  const dispatch = useDispatch();
  const tracksObj = useSelector((state) => state.tracks);
  const tracksArray = Object.values(tracksObj);

  // State for current playing track index.
  const [currentIndex, setCurrentIndex] = useState(0);
  // Create a ref for the audio element.
  const audioRef = useRef(null);

  // State for file upload.
  const [uploadFile, setUploadFile] = useState(null);
  // State for comment text.
  const [commentText, setCommentText] = useState("");

  // Fetch tracks on component mount.
  useEffect(() => {
    dispatch(thunkFetchTracks());
  }, [dispatch]);

  // Update the audio element source and play whenever the current track changes.
  useEffect(() => {
    if (tracksArray.length > 0 && audioRef.current) {
      audioRef.current.src = tracksArray[currentIndex].audio_url;
      audioRef.current.play();
    }
  }, [currentIndex, tracksArray]);

  // Handler to skip to the next song.
  const handleSkip = () => {
    if (tracksArray.length) {
      const nextIndex = (currentIndex + 1) % tracksArray.length;
      setCurrentIndex(nextIndex);
    }
  };

  // Handler for file selection.
  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  // Handler to upload a new track.
  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploadFile) {
      const formData = new FormData();
      formData.append("audio_file", uploadFile);
      formData.append("title", "New Track");
      formData.append("genre", "Unknown");
      formData.append("duration", 180);
      await dispatch(thunkCreateTrack(formData));
      setUploadFile(null);
    }
  };

  // Handler for liking the current track.
  const handleLike = async () => {
    if (tracksArray[currentIndex]) {
      await dispatch(thunkLikeTrack(tracksArray[currentIndex].id));
    }
  };

  // Handler for unliking the current track.
  const handleUnlike = async () => {
    if (tracksArray[currentIndex]) {
      await dispatch(thunkUnlikeTrack(tracksArray[currentIndex].id));
    }
  };

  // Handler for adding the current track to a personal playlist.
  const handleAddToPlaylist = async () => {
    if (tracksArray[currentIndex]) {
      const playlistData = {
        name: "My Playlist",
        trackId: tracksArray[currentIndex].id,
      };
      await dispatch(thunkCreatePlaylist(playlistData));
    }
  };

  // Handler for posting a comment.
  const handlePostComment = async () => {
    if (tracksArray[currentIndex] && commentText.trim()) {
      await dispatch(thunkCreateComment(tracksArray[currentIndex].id, commentText));
      setCommentText("");
    }
  };

  // Handler for updating a comment.
  const handleUpdateComment = async (commentId) => {
    if (tracksArray[currentIndex] && commentText.trim()) {
      await dispatch(thunkUpdateComment(tracksArray[currentIndex].id, commentId, commentText));
      setCommentText("");
    }
  };

  // Handler for deleting a comment.
  const handleDeleteComment = async (commentId) => {
    await dispatch(thunkDeleteComment(tracksArray[currentIndex].id, commentId));
  };

  return (
    <div className="main-page">
      {/* Header banner */}
      <header className="boom-box-header">
        <h1 className="logo-banner">LEMONCHORD</h1>
      </header>

      {/* Boom box body */}
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
          {/* Audio player integrated into the UI */}
          <div className="audio-player">
            <audio 
              ref={audioRef} 
              controls 
              onEnded={handleSkip}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
          {/* Upload slot */}
          <div className="upload-slot">
            <form onSubmit={handleUpload}>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
              />
              <button type="submit">Upload Your Track</button>
            </form>
          </div>
        </div>

        <div className="speaker right-speaker">
          <div className="spinning-lemons"></div>
        </div>
      </div>

      {/* Additional controls for liking, commenting, or adding to playlist */}
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
