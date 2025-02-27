// Action Types
const UPDATE_PLAYLIST = 'playlists/UPDATE_PLAYLIST';
const REMOVE_PLAYLIST = 'playlists/REMOVE_PLAYLIST';
const REMOVE_TRACK_FROM_PLAYLIST = 'playlists/REMOVE_TRACK_FROM_PLAYLIST';

// Action Creators
const updatePlaylistAction = (playlist) => ({
    type: UPDATE_PLAYLIST,
    playlist
});

const removePlaylistAction = (playlistId) => ({
    type: REMOVE_PLAYLIST,
    playlistId
});

const removeTrackFromPlaylistAction = (playlistId, trackId) => ({
    type: REMOVE_TRACK_FROM_PLAYLIST,
    playlistId,
    trackId
});

// Thunks
export const updatePlaylist = (playlistId, name) => async (dispatch) => {
    const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    if (response.ok) {
        const playlist = await response.json();
        dispatch(updatePlaylistAction(playlist));
        return playlist;
    }
};

export const deletePlaylist = (playlistId) => async (dispatch) => {
    const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        dispatch(removePlaylistAction(playlistId));
        return true;
    }
};

export const removeTrackFromPlaylist = (playlistId, trackId) => async (dispatch) => {
    const response = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        dispatch(removeTrackFromPlaylistAction(playlistId, trackId));
        return true;
    }
};

// Reducer
const playlistReducer = (state = {}, action) => {
    switch (action.type) {
        case UPDATE_PLAYLIST:
            return {
                ...state,
                [action.playlist.id]: action.playlist
            };
        case REMOVE_PLAYLIST:
            const newState = { ...state };
            delete newState[action.playlistId];
            return newState;
        case REMOVE_TRACK_FROM_PLAYLIST:
            return {
                ...state,
                [action.playlistId]: {
                    ...state[action.playlistId],
                    tracks: state[action.playlistId].tracks.filter(
                        track => track.id !== action.trackId
                    )
                }
            };
        default:
            return state;
    }
};

export default playlistReducer;
