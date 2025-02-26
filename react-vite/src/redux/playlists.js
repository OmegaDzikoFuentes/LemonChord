// playlists.js

// Action Types
const LOAD_PLAYLISTS = 'playlists/loadPlaylists';
const ADD_PLAYLIST = 'playlists/addPlaylist';
const UPDATE_PLAYLIST = 'playlists/updatePlaylist';
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

const removePlaylist = (playlistId) => ({
  type: REMOVE_PLAYLIST,
  payload: playlistId
});

// Thunks 
export const thunkFetchPlaylists = () => async (dispatch) => {
  const response = await fetch('/api/playlists/');
  if (response.ok) {
    const data = await response.json();
    dispatch(loadPlaylists(data.playlists));
    return data;
  }
};

export const thunkCreatePlaylist = (playlistData) => async (dispatch) => {
  const response = await fetch('/api/playlists/', {
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

// Reducer
const initialState = {};

const playlistsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_PLAYLISTS: {
      const newState = {};
      action.payload.forEach(playlist => {
        newState[playlist.id] = playlist;
      });
      return newState;
    }
    case ADD_PLAYLIST:
    case UPDATE_PLAYLIST: {
      return { ...state, [action.payload.id]: action.payload };
    }
    case REMOVE_PLAYLIST: {
      const { [action.payload]: removed, ...rest } = state;
      return rest;
    }
    default:
      return state;
  }
};

export default playlistsReducer;
