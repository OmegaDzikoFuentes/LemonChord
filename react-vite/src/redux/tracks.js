// Action Types
const LOAD_TRACKS = 'tracks/loadTracks';
const ADD_TRACK = 'tracks/addTrack';
const UPDATE_TRACK = 'tracks/updateTrack';
const REMOVE_TRACK = 'tracks/removeTrack';

// Action Creators
const loadTracks = (tracks) => ({
  type: LOAD_TRACKS,
  payload: tracks
});

const addTrack = (track) => ({
  type: ADD_TRACK,
  payload: track
});

const updateTrack = (track) => ({
  type: UPDATE_TRACK,
  payload: track
});

const removeTrack = (trackId) => ({
  type: REMOVE_TRACK,
  payload: trackId
});

// Thunk: Fetch tracks from the ultimate_playlist route
export const thunkFetchTracks = (
  page = 1,
  per_page = 10,
  sort_by = 'created_at',
  genre = null
) => async (dispatch) => {
  let url = `/api/main/ultimate_playlist?page=${page}&per_page=${per_page}&sort_by=${sort_by}`;
  if (genre) url += `&genre=${genre}`;
  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    // Assuming data.tracks contains an array of track objects.
    dispatch(loadTracks(data.tracks));
    return data;
  }
};

// Thunk: Create a new track (for file uploads, formData is expected)
export const thunkCreateTrack = (formData) => async (dispatch) => {
  const response = await fetch('/api/tracks/', {
    method: 'POST',
    body: formData
  });
  if (response.ok) {
    const newTrack = await response.json();
    dispatch(addTrack(newTrack));
    return newTrack;
  }
};

// Thunk: Update an existing track
export const thunkUpdateTrack = (trackId, formData) => async (dispatch) => {
  const response = await fetch(`/api/tracks/${trackId}`, {
    method: 'PUT', // or PATCH if preferred
    body: formData
  });
  if (response.ok) {
    const updatedTrack = await response.json();
    dispatch(updateTrack(updatedTrack));
    return updatedTrack;
  }
};

// Thunk: Delete a track
export const thunkDeleteTrack = (trackId) => async (dispatch) => {
  const response = await fetch(`/api/tracks/${trackId}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    dispatch(removeTrack(trackId));
  }
};

// Initial State
const initialState = {};

// Reducer: Normalize the tracks into an object keyed by track ID
const tracksReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_TRACKS: {
      const newState = {};
      action.payload.forEach((track) => {
        newState[track.id] = track;
      });
      return newState;
    }
    case ADD_TRACK:
    case UPDATE_TRACK: {
      return { ...state, [action.payload.id]: action.payload };
    }
    case REMOVE_TRACK: {
      const { [action.payload]: removed, ...rest } = state;
      return rest;
    }
    default:
      return state;
  }
};

export default tracksReducer;
