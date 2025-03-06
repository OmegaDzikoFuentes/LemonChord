// Action Types
const LOAD_USER_TRACKS = 'userTracks/loadTracks';
const ADD_USER_TRACK = 'userTracks/addTrack';
const UPDATE_USER_TRACK = 'userTracks/updateTrack';
const REMOVE_USER_TRACK = 'userTracks/removeTrack';

// Action Creators
const loadUserTracks = (tracks) => ({
  type: LOAD_USER_TRACKS,
  payload: tracks
});

const addUserTrack = (track) => ({
  type: ADD_USER_TRACK,
  payload: track
});

const updateUserTrack = (track) => ({
  type: UPDATE_USER_TRACK,
  payload: track
});

const removeUserTrack = (trackId) => ({
  type: REMOVE_USER_TRACK,
  payload: trackId
});

// Thunk: Create a new track (for file uploads, formData is expected)
export const thunkCreateTrack = (formData) => async (dispatch) => {
  const response = await fetch('/api/tracks/', {
    method: 'POST',
    body: formData
  });
  
  const responseData = await response.json();
  const newTrack = responseData.data;
  dispatch(addUserTrack(newTrack));
  return newTrack;
};

// Thunk: Update an existing track
export const thunkUpdateTrack = (trackId, formData) => async (dispatch) => {
  const response = await fetch(`/api/tracks/${trackId}`, {
    method: 'PUT', // or PATCH if preferred
    body: formData
  });
  if (response.ok) {
    const updatedTrack = await response.json();
    dispatch(updateUserTrack(updatedTrack));
    return updatedTrack;
  }
};

// Thunk: Fetch tracks for the current user
export const thunkFetchUserTracks = () => async (dispatch) => {
  const response = await fetch('/api/tracks/user');
  if (response.ok) {
    const responseData = await response.json();
    // Expecting responseData.data.tracks to be an array of tracks
    dispatch(loadUserTracks(responseData.data.tracks));
    return responseData;
  }
};

// Thunk: Delete a track
export const thunkDeleteTrack = (trackId) => async (dispatch) => {
  const response = await fetch(`/api/tracks/${trackId}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    dispatch(removeUserTrack(trackId));
  }
};

// Initial State
const initialState = {};

// Reducer: Normalize the user tracks into an object keyed by track ID
const userTracksReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_USER_TRACKS: {
      const newState = {};
      action.payload.forEach((track) => {
        newState[track.id] = track;
      });
      return newState;
    }
    case ADD_USER_TRACK:
    case UPDATE_USER_TRACK: {
      return { ...state, [action.payload.id]: action.payload };
    }
    case REMOVE_USER_TRACK: {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
};

export default userTracksReducer;
