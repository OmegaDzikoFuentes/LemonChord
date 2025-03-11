// myPlaylist.js

// Action Types
const LOAD_PLAYLISTS = 'playlists/loadPlaylists';
const ADD_PLAYLIST = 'playlists/addPlaylist';
const UPDATE_PLAYLIST = 'playlists/updatePlaylist';
 
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

// Thunk: Fetch playlists (user's personal playlists)
export const thunkFetchPlaylists = () => async (dispatch) => {
  const response = await fetch('/api/myplaylist/');
  if (response.ok) {
    const data = await response.json();
    dispatch(loadPlaylists(data.playlists));
    return data;
  }
};

// Thunk: Create a new playlist
export const thunkCreatePlaylist = (playlistData) => async (dispatch) => {
  const response = await fetch('/api/myplaylist/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playlistData)
  });
  if (response.ok) {
    const newPlaylist = await response.json();
    dispatch(addPlaylist(newPlaylist));
    return newPlaylist;
  }
};

// Thunk: Delete a track from a playlist
export const thunkDeleteTrackFromPlaylist = (playlistId, trackId) => async (dispatch) => {
  const response = await fetch(`/api/myplaylist/${playlistId}/tracks/${trackId}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    const updatedPlaylist = await response.json();
    // Assuming the updated playlist data is under "data"
    dispatch(updatePlaylist(updatedPlaylist.data));
    return updatedPlaylist;
  }
};

// Reducer
const initialState = {};

const playlistsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_PLAYLISTS: {
      const newState = {};
      action.payload.forEach((playlist) => {
        newState[playlist.id] = playlist;
      });
      return newState;
    }
    case ADD_PLAYLIST:
    case UPDATE_PLAYLIST: {
      return { ...state, [action.payload.id]: action.payload };
    }
    default:
      return state; // Add this default case to return the current state
  }
};

export default playlistsReducer;