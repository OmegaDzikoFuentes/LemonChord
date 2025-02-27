import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkFetchTracks, thunkCreateTrack } from "../../redux/tracks";
import { thunkLikeTrack, thunkUnlikeTrack } from "../../redux/likes";
import { thunkCreateComment, thunkUpdateComment, thunkDeleteComment } from "../../redux/comments";
import { thunkCreatePlaylist } from "../../redux/playlists";

import "./MainPlaylist.css";

function MainPage() {
  const dispatch = useDispatch();
  // Get tracks from Redux store; assuming a normalized state keyed by id.
  const tracksObj = useSelector((state) => state.tracks);
  const tracksArray = Object.values(tracksObj);
  
  // State for current playing track index and audio element.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audio, setAudio] = useState(null);
  // State for file upload.
  const [uploadFile, setUploadFile] = useState(null);
  // State for comment text.
  const [commentText, setCommentText] = useState("");

  // Fetch tracks on component mount.
  useEffect(() => {
    dispatch(thunkFetchTracks());
  }, [dispatch]);

  // When tracks are loaded, start playing a random track.
  useEffect(() => {
    if (tracksArray.length && !audio) {
      // Randomize the order (here we simply pick a random starting index).
      const randomIndex = Math.floor(Math.random() * tracksArray.length);
      setCurrentIndex(randomIndex);
      const newAudio = new Audio(tracksArray[randomIndex].audio_url);
      newAudio.play();
      setAudio(newAudio);
    }
  }, [tracksArray, audio]);

  // Handler to skip to the next song.
  const handleSkip = () => {
    if (tracksArray.length) {
      if (audio) {
        audio.pause();
      }
      const nextIndex = (currentIndex + 1) % tracksArray.length;
      setCurrentIndex(nextIndex);
      const newAudio = new Audio(tracksArray[nextIndex].audio_url);
      newAudio.play();
      setAudio(newAudio);
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
      // In a real app, you’d include additional metadata (title, genre, duration, etc.)
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
    // Here, we assume creating a playlist with the current track.
    // In a real app, you might select an existing playlist.
    if (tracksArray[currentIndex]) {
      const playlistData = {
        name: "My Playlist",
        // Additional data can be sent as needed; here we include the track ID.
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
          {/* Upload slot (positioned where a tape deck insert might be) */}
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
          <button className="update-comment-button" onClick={handleUpdateComment}>Update Comment </button>
          <button className="delete-comment-button" onClick={handleDeleteComment}>Delete Comment</button>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
