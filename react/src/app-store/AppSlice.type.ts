import type { AuthSlice } from "@/react/auth/slice/auth-slice.types";
import type { EventLibrarySlice } from "@/react/event-library/slice/EventLibrarySlice.type";
import type { EventSlice } from "@/react/event/slice/EventSlice.type";
import type { NavigationSlice } from "@/react/navigation/slice/NavigationSlice.type";
import type { PlaylistLibrarySlice } from "@/react/playlist-library/slice/playlist-library-slice";
import type { PlaylistSlice } from "@/react/playlist/slice/playlist-slice";
import type { SongLibrarySlice } from "@/react/song-library/slice/song-library-slice";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import type { UserLibrarySlice } from "@/react/user-library/slice/UserLibrarySlice.type";

// Compose slices
type AppSlice = AuthSlice &
	SongSubscribeSlice &
	SongLibrarySlice &
	UserLibrarySlice &
	PlaylistSlice &
	PlaylistLibrarySlice &
	EventSlice &
	EventLibrarySlice &
	NavigationSlice;

export type { AppSlice };
