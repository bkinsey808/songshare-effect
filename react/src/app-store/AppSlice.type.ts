import type { NavigationSlice } from "@/react/navigation/navigation-slice";
import type { PlaylistLibrarySlice } from "@/react/playlist-library/slice/playlist-library-slice";
import type { PlaylistSlice } from "@/react/playlist/slice/playlist-slice";
import type { SongLibrarySlice } from "@/react/song-library/slice/song-library-slice";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import type { UserLibrarySlice } from "@/react/user-library/slice/user-library-slice";

import type { AuthSlice } from "../auth/slice/auth-slice.types";

// Compose slices
type AppSlice = AuthSlice &
	SongSubscribeSlice &
	SongLibrarySlice &
	UserLibrarySlice &
	PlaylistSlice &
	PlaylistLibrarySlice &
	NavigationSlice;

export type { AppSlice };
