import useCurrentUserId from "@/react/auth/useCurrentUserId";

import useActiveSongSelectionState from "../../form/useActiveSongSelectionState";
import useEventView from "../../view/useEventView";
import useEventManageState from "../useEventManageState";

/**
 * State returned by `useSlideManagerState`.
 *
 * The hook composes existing event hooks to keep the manager in sync with the
 * backend (realtime subscriptions, autosaves, etc.) while exposing only the
 * pieces required by the slide manager UI.
 */
export type UseSlideManagerStateResult = {
	activePlaylistId: string | undefined;
	activeSongId: string | undefined;
	activeSlidePosition: number | undefined;
	activeSongTotalSlides: number;

	// full list of songs and slides so the UI can render dropdowns/numeric inputs
	availablePlaylistSongs: readonly { songId: string; songName: string }[];
	availableSongSlidePositions: readonly { slideId: string; position: number; slideName: string }[];

	updateActiveSong: (songId: string) => void;
	updateActiveSlidePosition: (slidePosition: number | undefined) => void;

	/**
	 * Whether the current user has permission to view/use the slide manager.
	 * Owners, event admins, and playlist admins all qualify.
	 */
	canAccess: boolean;
};

export default function useSlideManagerState(): UseSlideManagerStateResult {
	const eventManage = useEventManageState();
	const eventView = useEventView();
	const currentUserId = useCurrentUserId();

	// derive playlist/song/slide options from store (same logic used elsewhere)
	const { availablePlaylistSongs, availableSongSlidePositions } = useActiveSongSelectionState({
		activePlaylistId: eventManage.eventPublic?.active_playlist_id,
		activeSongId: eventManage.eventPublic?.active_song_id,
	});

	// determine if the user is a playlist admin on this event
	const currentParticipant =
		currentUserId === undefined
			? undefined
			: (eventManage.participants ?? []).find(
					(participant) => participant.user_id === currentUserId,
				);
	const isPlaylistAdmin = currentParticipant?.role === "event_playlist_admin";

	const canAccess = eventManage.canManageEvent || isPlaylistAdmin;

	return {
		activePlaylistId: eventManage.eventPublic?.active_playlist_id,
		activeSongId: eventManage.eventPublic?.active_song_id,
		activeSlidePosition: eventView.activeSlidePosition,
		activeSongTotalSlides: eventView.activeSongTotalSlides,
		availablePlaylistSongs,
		availableSongSlidePositions,
		updateActiveSong: eventManage.updateActiveSong,
		updateActiveSlidePosition: eventManage.updateActiveSlidePosition,
		canAccess,
	};
}
