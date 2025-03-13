// Action Types
const LOAD_PLAYLISTS = 'playlists/loadPlaylists';
const ADD_PLAYLIST = 'playlists/addPlaylist';
const UPDATE_PLAYLIST = 'playlists/updatePlaylist';
const ADD_TRACK_TO_PLAYLIST = 'playlists/addTrackToPlaylist';
const REMOVE_PLAYLIST = 'playlists/removePlaylist';
 
// Action Creators
const loadPlaylists = (playlists) => ({
  type: LOAD_PLAYLISTS,
  payload: playlists 
});

const addPlaylist = (playlist) => ({
  type: ADD_PLAYLIST,
  payload: playlist 
});

const updatePlaylist = (playlist) => ({
  type: UPDATE_PLAYLIST,
  payload: playlist 
});

const addTrackToPlaylist = (playlist) => ({
  type: ADD_TRACK_TO_PLAYLIST,
  payload: playlist
});

const removePlaylist = (playlistId) => ({
  type: REMOVE_PLAYLIST,
  payload: playlistId
});

// Thunk: Fetch playlists (user's personal playlists)
export const thunkFetchPlaylists = () => async (dispatch) => {
  try {
    const response = await fetch('/api/myplaylist/');
    if (!response.ok) throw response;
    
    const data = await response.json();
    // The API returns playlists in data.playlists
    dispatch(loadPlaylists(data.data?.playlists || data.playlists || data.data || data));
    return data;
  } catch (error) {
    console.error("Error fetching playlists:", error);
  }
};

// Thunk: Create a new playlist
export const thunkCreatePlaylist = (playlistData) => async (dispatch) => {
  try {
    const response = await fetch('/api/myplaylist/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistData)
    });
    if (!response.ok) throw response;
    
    const newPlaylist = await response.json();
    dispatch(addPlaylist(newPlaylist.data || newPlaylist));
    return newPlaylist;
  } catch (error) {
    console.error("Error creating playlist:", error);
  }
};

// Thunk: Add a track to an existing playlist
export const thunkAddTrackToPlaylist = (playlistId, trackId) => async (dispatch) => {
  try {
    const response = await fetch(`/api/myplaylist/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId })
    });
    if (!response.ok) throw response;
    
    const updatedPlaylist = await response.json();
    dispatch(addTrackToPlaylist(updatedPlaylist.data || updatedPlaylist));
    return updatedPlaylist;
  } catch (error) {
    console.error("Error adding track to playlist:", error);
  }
};

// Thunk: Delete a track from a playlist
export const thunkDeleteTrackFromPlaylist = (playlistId, trackId) => async (dispatch) => {
  try {
    const response = await fetch(`/api/myplaylist/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw response;
    
    const updatedPlaylist = await response.json();
    dispatch(updatePlaylist(updatedPlaylist.data || updatedPlaylist));
    return updatedPlaylist;
  } catch (error) {
    console.error("Error removing track from playlist:", error);
  }
};

// Thunk: delete a playlist
export const thunkDeletePlaylist = (playlistId) => async (dispatch) => {
  try {
    const response = await fetch(`/api/myplaylist/${playlistId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw response;
    
    // On success, dispatch action to remove from store
    dispatch(removePlaylist(playlistId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return { success: false, error };
  }
};

const initialState = {};

// Revised reducer
const playlistsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_PLAYLISTS: {
      const newState = {};
      // Handle different possible response formats
      const playlists = action.payload?.data?.playlists || 
                        action.payload?.playlists || 
                        action.payload || 
                        [];
      
      // Convert to array if it's not already
      const playlistsArray = Array.isArray(playlists) ? playlists : Object.values(playlists);
      
      playlistsArray.forEach((playlist) => {
        newState[playlist.id] = playlist;
      });
      return newState;
    }
    case ADD_PLAYLIST:
    case UPDATE_PLAYLIST:
    case ADD_TRACK_TO_PLAYLIST: {
      // Handle nested data structures from API responses
      const playlist = action.payload?.data || action.payload;
      return { ...state, [playlist.id]: playlist };
    }
    case REMOVE_PLAYLIST: {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
};

export default playlistsReducer;