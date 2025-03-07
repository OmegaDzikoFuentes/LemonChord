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

// Thunk: Fetch playlists
export const thunkFetchPlaylists = () => async (dispatch) => {
  const response = await fetch('/api/playlist/');
  if (response.ok) {
    const data = await response.json();
    dispatch(loadPlaylists(data.playlists));
    return data;
  }
};

// Thunk: Create a new playlist
export const thunkCreatePlaylist = (playlistData) => async (dispatch) => {
  const response = await fetch('/api/playlist/', {
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
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
};

export default playlistsReducer;
