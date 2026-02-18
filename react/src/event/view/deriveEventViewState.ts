import type { EventEntry } from "@/react/event/event-types";
import type { SongPublic } from "@/react/song/song-schema";

import { utcTimestampToClientLocalDate } from "@/shared/utils/formatEventDate";

type DeriveEventViewStateParams = {
	currentEvent: EventEntry | undefined;
	currentUserId: string | undefined;
	publicSongs: Record<string, SongPublic>;
};

type DerivedEventViewState = {
	eventPublic: EventEntry["public"];
	ownerUsername: string | undefined;
	participants: EventEntry["participants"];
	isParticipant: boolean;
	isOwner: boolean;
	shouldShowActions: boolean;
	activeSongName: string | undefined;
	displayDate: string | undefined;
};

/**
 * Computes render-ready state for the event view from store/auth inputs.
 *
 * @param params - Event, user, and song inputs used to derive view state
 * @returns Derived values consumed by the event view UI
 */
export default function deriveEventViewState(
	params: Readonly<DeriveEventViewStateParams>,
): DerivedEventViewState {
	const { currentEvent, currentUserId, publicSongs } = params;
	const participants = currentEvent?.participants ?? [];
	const eventPublic = currentEvent?.public;
	const ownerUsername = currentEvent?.owner_username;
	const isParticipant =
		currentUserId !== undefined && currentUserId !== ""
			? participants.some((participant) => participant.user_id === currentUserId)
			: false;
	const isOwner =
		currentUserId !== undefined &&
		currentUserId !== "" &&
		currentEvent !== undefined &&
		currentUserId === currentEvent.owner_id;
	const shouldShowActions = currentUserId !== undefined && currentUserId !== "" && !isOwner;
	const activeSongName =
		eventPublic?.active_song_id !== undefined && eventPublic.active_song_id !== null
			? (publicSongs[eventPublic.active_song_id]?.song_name ?? eventPublic.active_song_id)
			: undefined;
	const displayDate =
		eventPublic?.event_date !== undefined && eventPublic.event_date !== ""
			? utcTimestampToClientLocalDate(eventPublic.event_date)
			: undefined;

	return {
		eventPublic,
		ownerUsername,
		participants,
		isParticipant,
		isOwner,
		shouldShowActions,
		activeSongName,
		displayDate,
	};
}
