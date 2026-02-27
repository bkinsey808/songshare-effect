import type { EventEntry } from "@/react/event/event-types";
import type { ActionState } from "../ActionState.type";

export type UseEventManageStateResult = {
	readonly currentEvent: EventEntry | undefined;
	readonly eventPublic: EventEntry["public"];
	readonly participants: EventEntry["participants"];
	readonly ownerId: string | undefined;
	readonly ownerUsername: string | undefined;
	readonly isEventLoading: boolean;
	readonly eventError: string | undefined;
	readonly canManageEvent: boolean;
	readonly actionState: ActionState;
	readonly inviteUserIdInput: string | undefined;
	readonly activePlaylistIdForSelector: string | undefined;
	readonly activeSongIdForSelector: string | undefined;
	readonly activeSlidePositionForSelector: number | undefined;
	readonly updateActivePlaylist: (playlistId: string) => void;
	readonly updateActiveSong: (songId: string) => void;
	readonly updateActiveSlidePosition: (slidePosition: number | undefined) => void;
	readonly onBackClick: () => void;
	readonly onInviteClick: () => void;
	readonly onInviteUserSelect: (userId: string | undefined) => void;
	readonly onPlaylistSelect: (playlistId: string) => void;
	readonly onSongSelect: (songId: string) => void;
	readonly onSlidePositionSelect: (slidePosition: number | undefined) => void;
	readonly onKickParticipant: (userId: string) => void;
};
