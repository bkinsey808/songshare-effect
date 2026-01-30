import type { PlaylistState } from "../playlist-types";

const playlistSliceInitialState: PlaylistState = {
	currentPlaylist: undefined,
	isPlaylistLoading: false,
	playlistError: undefined as string | undefined,
	isPlaylistSaving: false,
};

export default playlistSliceInitialState;
