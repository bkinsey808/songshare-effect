import type { AuthSlice } from "@/react/auth/slice/auth-slice.types";
import type { CommunitySlice } from "@/react/community/slice/CommunitySlice.type";
import type { EventLibrarySlice } from "@/react/event-library/slice/EventLibrarySlice.type";
import type { EventSlice } from "@/react/event/slice/EventSlice.type";
import type { ImageLibrarySlice } from "@/react/image-library/slice/ImageLibrarySlice.type";
import type { ImageSlice } from "@/react/image/image-slice/ImageSlice.type";
import type { InvitationSlice } from "@/react/invitation/slice/InvitationSlice.type";
import type { NavigationSlice } from "@/react/navigation/slice/NavigationSlice.type";
import type { PlaylistLibrarySlice } from "@/react/playlist-library/slice/PlaylistLibrarySlice.type";
import type { PlaylistSlice } from "@/react/playlist/slice/playlist-slice";
import type { ShareSlice } from "@/react/share/slice/ShareSlice.type";
import type { SongLibrarySlice } from "@/react/song-library/slice/song-library-slice";
import type { SongSubscribeSlice } from "@/react/song/song-slice/song-slice";
import type { TagLibrarySlice } from "@/react/tag-library/slice/TagLibrarySlice.type";
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
	ImageSlice &
	ImageLibrarySlice &
	CommunitySlice &
	InvitationSlice &
	NavigationSlice &
	ShareSlice &
	TagLibrarySlice;

export type { AppSlice };
