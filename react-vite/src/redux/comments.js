// comments.js

// Action Types
const LOAD_COMMENTS = 'comments/loadComments';
const ADD_COMMENT = 'comments/addComment';
const UPDATE_COMMENT = 'comments/updateComment';
const REMOVE_COMMENT = 'comments/removeComment';

// Action Creators
const loadComments = (comments) => ({
  type: LOAD_COMMENTS,
  payload: comments
});

const addComment = (comment) => ({
  type: ADD_COMMENT,
  payload: comment
});

const updateComment = (comment) => ({
  type: UPDATE_COMMENT,
  payload: comment
});

const removeComment = (commentId) => ({
  type: REMOVE_COMMENT,
  payload: commentId
});

// Thunk: Fetch comments for a specific track
export const thunkFetchComments = (trackId, page = 1, per_page = 10) => async (dispatch) => {
  const response = await fetch(`/api/comments/tracks/${trackId}/comments?page=${page}&per_page=${per_page}`);
  if (response.ok) {
    const data = await response.json();
    // Assuming data.comments is an array of comment objects.
    dispatch(loadComments(data.comments));
    return data;
  }
};

// Thunk: Create a new comment on a track
export const thunkCreateComment = (trackId, text) => async (dispatch) => {
  const response = await fetch(`/api/comments/tracks/${trackId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (response.ok) {
    const comment = await response.json();
    dispatch(addComment(comment));
    return comment;
  }
};

// Thunk: Update an existing comment
export const thunkUpdateComment = (commentId, text) => async (dispatch) => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'PUT', // or PATCH based on your backend implementation
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (response.ok) {
    const updatedComment = await response.json();
    dispatch(updateComment(updatedComment));
    return updatedComment;
  }
};

// Thunk: Delete a comment
export const thunkDeleteComment = (commentId) => async (dispatch) => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    dispatch(removeComment(commentId));
  }
};

// Initial State
const initialState = {};

// Reducer: Normalizes comments by their id
const commentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_COMMENTS: {
      const newState = { ...state };
      action.payload.forEach(comment => {
        newState[comment.id] = comment;
      });
      return newState;
    }
    case ADD_COMMENT:
    case UPDATE_COMMENT: {
      return { ...state, [action.payload.id]: action.payload };
    }
    case REMOVE_COMMENT: {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
};

export default commentsReducer;
