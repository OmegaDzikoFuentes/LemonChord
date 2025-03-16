// MainPage.js
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkFetchGlobalTracks } from "../../redux/globalTracks";
import { thunkCreateTrack } from "../../redux/userTracks"; // for uploading a track globally
import { thunkLikeTrack, thunkUnlikeTrack } from "../../redux/likes";
import { 
  thunkFetchComments,
  thunkCreateComment, 
  thunkUpdateComment, 
  thunkDeleteComment 
} from "../../redux/comments";
import { 
  thunkFetchPlaylists,
  thunkCreatePlaylist,
  thunkAddTrackToPlaylist     
 } from "../../redux/playlists";
import "./MainPlaylist.css";

function MainPage() {
  const dispatch = useDispatch();
  const tracksObj = useSelector((state) => state.globalTracks);
  const commentsObj = useSelector((state) => state.comments);
  const likes = useSelector((state) => state.likes);
  const tracksArray = useMemo(() => Object.values(tracksObj), [tracksObj]);
  const playlists = useSelector((state) => state.playlists);
  const playlistsArray = Object.values(playlists);
  
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
  const [isPlaying, setIsPlaying] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);

  // Fetch global tracks on component mount.
  useEffect(() => {
    dispatch(thunkFetchGlobalTracks());
    dispatch(thunkFetchPlaylists());
  }, [dispatch]);

  // Fetch comments for the current track whenever it changes.
  useEffect(() => {
    if (tracksArray.length > 0) {
      dispatch(thunkFetchComments(tracksArray[currentIndex].id));
    }
  }, [dispatch, currentIndex, tracksArray]);

// Update audio element source when the current track changes.
// Effect for handling track changes
// Update audio element source when the current track changes.
useEffect(() => {
  if (tracksArray.length > 0 && audioRef.current) {
    const wasPlaying = isPlaying;
    
    // Only update audio source if the track has actually changed
    if (audioRef.current.src !== tracksArray[currentIndex].audio_url) {
      audioRef.current.src = tracksArray[currentIndex].audio_url;
      audioRef.current.currentTime = 0; // Start from beginning for new tracks
      
      if (wasPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error("Playback error:", e));
        }
      }
    }
  }
}, [currentIndex, tracksArray]);

const handleSkip = useCallback(() => {
  if (tracksArray.length) {
    const nextIndex = (currentIndex + 1) % tracksArray.length;
    setCurrentIndex(nextIndex);
  }
}, [currentIndex, tracksArray]); 

//effect for audio element event listeners:
useEffect(() => {
  const audioElement = audioRef.current; // Store ref in a variable inside the effect
  
  // Only add listeners if the audio element exists
  if (audioElement) {
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      handleSkip(); // Automatically move to next track
    };
    
    // Add event listeners
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    
    // Cleanup function uses the stored reference
    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }
}, [handleSkip]); 

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

      // Simulate upload progress.
      setTimeout(() => setUploadProgress(50), 500);
      setTimeout(() => setUploadProgress(80), 1000);

      await dispatch(thunkCreateTrack(formData));
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      
      setUploadFile(null);
      setUploadTitle("");
      setUploadGenre("");
      setUploadDuration("");
      setShowUploadForm(false);
    }
  };

  // Function to add the current track to a playlist.
  const handleAddToPlaylist = async () => {
    if (!tracksArray[currentIndex]) return;
    
    // Show options dialog
    const options = ["Create New Playlist"];
    
    // Add existing playlists to options
    playlistsArray.forEach(playlist => {
      options.push(`Add to: ${playlist.name}`);
    });
    
    // If no playlists yet, just prompt for a name
    if (playlistsArray.length === 0) {
      const name = prompt("Enter playlist name:", "My Playlist");
      
      // Exit if user cancels the prompt
      if (name === null) return;
      
      const cleanName = name.trim() || "My Playlist";
      
      const playlistData = {
        name: cleanName,
        trackId: tracksArray[currentIndex].id,
      };
        
      await dispatch(thunkCreatePlaylist(playlistData));
      alert(`New playlist created: ${cleanName}`);
      return;
    }
    
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
        trackId: tracksArray[currentIndex].id,
      };
        
      await dispatch(thunkCreatePlaylist(playlistData));
      alert(`New playlist created: ${cleanName}`);
    } 
    // Handle adding to existing playlist
    else {
      const playlistIndex = selectedIndex - 1;
      const selectedPlaylist = playlistsArray[playlistIndex];
      
      // Check if track is already in the playlist
      const trackId = tracksArray[currentIndex].id;
      const trackAlreadyInPlaylist = selectedPlaylist.tracks?.some(track => track.id === trackId);
      
      if (trackAlreadyInPlaylist) {
        alert("This track is already in the selected playlist!");
        return;
      }
      
      await dispatch(thunkAddTrackToPlaylist(selectedPlaylist.id, trackId));
      alert(`Track added to playlist: ${selectedPlaylist.name}`);
    }
  };

  const handlePostComment = async () => {
    if (tracksArray[currentIndex] && commentText.trim()) {
      if (editingCommentId) {
        await dispatch(thunkUpdateComment(editingCommentId, commentText));
        setEditingCommentId(null);
      } else {
        await dispatch(thunkCreateComment(tracksArray[currentIndex].id, commentText));
      }
      setCommentText("");
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setCommentText(comment.text);
  };

  const handleDeleteComment = async (commentId) => {
    await dispatch(thunkDeleteComment(commentId));
  };

// Manual like/unlike functions for extra buttons.
const handleLike = () => {
  if (tracksArray[currentIndex]) {
    // Save current playback state
    const wasPlaying = isPlaying;
    const currentTime = audioRef.current?.currentTime || 0;
    
    // Crucial step: Pause the audio manually first to prevent interruption
    if (wasPlaying && audioRef.current) {
      audioRef.current.pause();
    }
    
    dispatch(thunkLikeTrack(tracksArray[currentIndex].id))
      .then(() => {
        // Restore playback state if necessary
        if (wasPlaying && audioRef.current) {
          audioRef.current.currentTime = currentTime;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.error("Playback error:", e));
          }
        }
      });
  }
};

const handleUnlike = () => {
  if (tracksArray[currentIndex]) {
    // Save current playback state
    const wasPlaying = isPlaying;
    const currentTime = audioRef.current?.currentTime || 0;
    
    // Crucial step: Pause the audio manually first to prevent interruption
    if (wasPlaying && audioRef.current) {
      audioRef.current.pause();
    }
    
    dispatch(thunkUnlikeTrack(tracksArray[currentIndex].id))
      .then(() => {
        // Restore playback state if necessary
        if (wasPlaying && audioRef.current) {
          audioRef.current.currentTime = currentTime;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.error("Playback error:", e));
          }
        }
      });
  }
};

  // Filter comments for the current track.
  const currentTrackComments = Object.values(commentsObj).filter(
    comment => tracksArray[currentIndex] && comment.track_id === tracksArray[currentIndex].id
  );

  console.log("Current Track Comments:", currentTrackComments);

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
          <button className="skip-button" onClick={handleSkip}>Skip</button>
          <div className="song-info">
            {tracksArray[currentIndex] && (
              <>
                <h2>{tracksArray[currentIndex].title}</h2>
                <p>{tracksArray[currentIndex].genre}</p>
                <span>{tracksArray[currentIndex].like_count} Lemons</span>
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
                <input type="file" accept="audio/*" onChange={handleFileChange} />
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
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
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
        {/* Additional manual buttons to explicitly trigger like/unlike actions */}
        <div className="manual-like-buttons">
          <button onClick={handleLike}>Like</button>
          <button onClick={handleUnlike}>Unlike</button>
          <span>
            {tracksArray[currentIndex] &&
              (likes[tracksArray[currentIndex].id] ? "Loved" : "almost liked")}
          </span>
        </div>
        <button className="add-to-playlist-button" onClick={handleAddToPlaylist}>
          Add to My Playlist
        </button>
        <div className="comments-section">
          <textarea
            placeholder={editingCommentId ? "Edit your comment..." : "Add a comment..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          ></textarea>
          <button className="comment-button" onClick={handlePostComment}>
            {editingCommentId ? "Update Comment" : "Post Comment"}
          </button>
          {editingCommentId && (
            <button className="cancel-edit-button" onClick={() => {
              setEditingCommentId(null);
              setCommentText("");
            }}>
              Cancel Edit
            </button>
          )}
        </div>
        <div className="comments-display">
          <h3>Comments</h3>
          {currentTrackComments.length > 0 ? (
            <ul className="comments-list">
              {currentTrackComments.map(comment => (
                <li key={comment.id} className="comment-item">
                  <div className="comment-content">
                    
                    <p className="comment-text">{comment.text}</p>
                    <p className="comment-author">
                      By: {comment.user_username || "Anonymous"}
                    </p>
                  </div>
                  <div className="comment-actions">
                    <button className="edit-comment-button" onClick={() => handleEditComment(comment)}>
                      Edit
                    </button>
                    <button className="delete-comment-button" onClick={() => handleDeleteComment(comment.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainPage;
