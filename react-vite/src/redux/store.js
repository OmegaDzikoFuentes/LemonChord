import {
  legacy_createStore as createStore,
  applyMiddleware,
  compose,
  combineReducers,
} from "redux";
import thunk from "redux-thunk";
import sessionReducer from "./session";
import globalTracksReducer from "./globalTracks";
import userTracksReducer from "./userTracks";
import playlistsReducer from "./playlists";
import commentsReducer from "./comments";
import likesReducer from "./likes";

const rootReducer = combineReducers({
  session: sessionReducer,
  globalTracks: globalTracksReducer,
  userTracks: userTracksReducer,
  playlists: playlistsReducer,
  comments: commentsReducer,
  likes: likesReducer,
});

let enhancer;
if (import.meta.env.MODE === "production") {
  enhancer = applyMiddleware(thunk);
} else {
  const logger = (await import("redux-logger")).default;
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  enhancer = composeEnhancers(applyMiddleware(thunk, logger));
}

const configureStore = (preloadedState) => {
  return createStore(rootReducer, preloadedState, enhancer);
};

export default configureStore;
