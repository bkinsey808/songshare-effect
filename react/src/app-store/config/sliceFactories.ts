import createAuthSlice from "@/react/auth/slice/createAuthSlice";
import { createNavigationSlice } from "@/react/navigation/navigation-slice";
import { createPlaylistLibrarySlice } from "@/react/playlist-library/slice/playlist-library-slice";
import { createPlaylistSlice } from "@/react/playlist/slice/playlist-slice";
import { createSongLibrarySlice } from "@/react/song-library/slice/song-library-slice";
import { createSongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import { createUserLibrarySlice } from "@/react/user-library/slice/user-library-slice";

// Keep this as a simple, ordered array of slice factory functions. The
// functions are called with the store `set/get/api` in `useAppStore.ts` so we
// intentionally export them raw (un-invoked).
const sliceFactories = [
	createAuthSlice,
	createSongSubscribeSlice,
	createSongLibrarySlice,
	createUserLibrarySlice,
	createPlaylistSlice,
	createPlaylistLibrarySlice,
	createNavigationSlice,
] as const;

export default sliceFactories;
