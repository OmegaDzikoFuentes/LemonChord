// likes.js

// Action Types
const ADD_LIKE = 'likes/addLike';
const REMOVE_LIKE = 'likes/removeLike';

// Action Creators
const addLike = (trackId) => ({
  type: ADD_LIKE,
  payload: trackId,
});

const removeLike = (trackId) => ({
  type: REMOVE_LIKE,
  payload: trackId,
});

// Thunk to like a track
export const thunkLikeTrack = (trackId) => async (dispatch) => {
  const response = await fetch(`/api/tracks/${trackId}/like`, {
    method: 'POST',
  });
  if (response.ok) {
    dispatch(addLike(trackId));
    return response;
  } else {
    const error = await response.json();
    return error;
  }
};

// Thunk to unlike a track
export const thunkUnlikeTrack = (trackId) => async (dispatch) => {
  const response = await fetch(`/api/tracks/${trackId}/like`, {
    method: 'DELETE',
  });
  if (response.ok) {
    dispatch(removeLike(trackId));
    return response;
  } else {
    const error = await response.json();
    return error;
  }
};

// Initial State: An object where each key is a trackId that the user has liked.
const initialState = {};

// Reducer
const likesReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_LIKE: {
      return { ...state, [action.payload]: true };
    }
    case REMOVE_LIKE: {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
};

export default likesReducer;
