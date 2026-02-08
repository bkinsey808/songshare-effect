import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { AppSlice } from "@/react/app-store/AppSlice.type";

import createAuthSlice from "@/react/auth/slice/createAuthSlice";
import createEventLibrarySlice from "@/react/event-library/slice/createEventLibrarySlice";
import createEventSlice from "@/react/event/slice/createEventSlice";
import createNavigationSlice from "@/react/navigation/slice/createNavigationSlice";
import { createPlaylistLibrarySlice } from "@/react/playlist-library/slice/playlist-library-slice";
import { createPlaylistSlice } from "@/react/playlist/slice/playlist-slice";
import { createSongLibrarySlice } from "@/react/song-library/slice/song-library-slice";
import { createSongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import createUserLibrarySlice from "@/react/user-library/slice/createUserLibrarySlice";

// Keep this as a simple, ordered array of slice factory functions. The
// functions are called with the store `set/get/api` in `useAppStore.ts` so we
// intentionally export them raw (un-invoked).
type SliceFactory = (
	set: Set<Partial<AppSlice>, AppSlice>,
	get: Get<Partial<AppSlice>, AppSlice>,
	api: Api<Partial<AppSlice>, AppSlice>,
) => Partial<AppSlice>;

const sliceFactories: readonly SliceFactory[] = [
	createAuthSlice,
	createSongSubscribeSlice,
	createSongLibrarySlice,
	createUserLibrarySlice,
	createPlaylistSlice,
	createPlaylistLibrarySlice,
	createEventSlice,
	createEventLibrarySlice,
	createNavigationSlice,
];

export type { SliceFactory };
export default sliceFactories;
