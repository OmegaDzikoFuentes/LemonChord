// globalTracks.js

// Action Types
const LOAD_GLOBAL_TRACKS = 'globalTracks/loadTracks';
const ADD_GLOBAL_TRACK = 'globalTracks/addTrack';
const UPDATE_GLOBAL_TRACK = 'globalTracks/updateTrack';
const REMOVE_GLOBAL_TRACK = 'globalTracks/removeTrack';

// Action Creators
export const loadGlobalTracks = (tracks) => ({
  type: LOAD_GLOBAL_TRACKS,
  payload: tracks
});

export const addGlobalTrack = (track) => ({
  type: ADD_GLOBAL_TRACK,
  payload: track
});

export const updateGlobalTrack = (track) => ({
  type: UPDATE_GLOBAL_TRACK,
  payload: track
});

export const removeGlobalTrack = (trackId) => ({
  type: REMOVE_GLOBAL_TRACK,
  payload: trackId
});

// Thunk: Fetch tracks from the ultimate_playlist endpoint
export const thunkFetchGlobalTracks = (
  page = 1,
  per_page = 100,
  sort_by = 'created_at',
  genre = null
) => async (dispatch) => {
  try {
    // Fix: Add the /api prefix to match your backend route structure
    let url = `/api/playlist/ultimate_playlist?page=${page}&per_page=${per_page}&sort_by=${sort_by}`;
    if (genre) url += `&genre=${genre}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // Handle non-200 responses
      const errorText = await response.text();
      console.error(`Error fetching tracks: ${response.status} ${response.statusText}`, errorText);
      return;
    }
    
    const responseData = await response.json();
    console.log("Tracks fetched successfully:", responseData);
    dispatch(loadGlobalTracks(responseData.data.tracks));
    return responseData;
  } catch (error) {
    console.error("Failed to fetch tracks:", error);
  }
};

// Initial State
const initialState = {};

// Reducer: Normalize the global tracks into an object keyed by track ID
const globalTracksReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_GLOBAL_TRACKS: {
      // Check if action.payload is defined and is an array
      if (!action.payload || !Array.isArray(action.payload)) {
        console.error("Invalid payload in LOAD_GLOBAL_TRACKS:", action.payload);
        return state;
      }
      
      const newState = {};
      action.payload.forEach((track) => {
        newState[track.id] = track;
      });
      return newState;
    }
    case ADD_GLOBAL_TRACK:
    case UPDATE_GLOBAL_TRACK: {
        return { 
          ...state, 
          [action.payload.id]: {
            ...state[action.payload.id],
            ...action.payload
          } 
        };
      }
    case REMOVE_GLOBAL_TRACK: {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
};

export default globalTracksReducer;