import type { EventEntry } from "@/react/event/event-types";

import {
	deriveCurrentParticipantStatus,
	getParticipantPermissions,
	type ParticipantStatus,
} from "@/react/event/participant-status/participantStatusMachine";
import { songFields, type SongPublic } from "@/react/song/song-schema";
import { utcTimestampToClientLocalDate } from "@/shared/utils/formatEventDate";

const ZERO = 0;
const FIRST_POSITION = 1;

type DeriveEventViewStateParams = {
	currentEvent: EventEntry | undefined;
	currentUserId: string | undefined;
	publicSongs: Record<string, SongPublic>;
};

type DerivedEventViewState = {
	eventPublic: EventEntry["public"];
	ownerUsername: string | undefined;
	participants: EventEntry["participants"];
	participantStatus: ParticipantStatus;
	canViewFullEvent: boolean;
	canViewSlides: boolean;
	canJoin: boolean;
	canLeave: boolean;
	isParticipant: boolean;
	isOwner: boolean;
	shouldShowActions: boolean;
	activeSongName: string | undefined;
	activeSlidePosition: number | undefined;
	activeSlideName: string | undefined;
	activeSlide: SongPublic["slides"][string] | undefined;
	activeSlideDisplayFields: readonly string[];
	activeSongTotalSlides: number;
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
	const participantStatus = deriveCurrentParticipantStatus(currentEvent, currentUserId);
	const participantPermissions = getParticipantPermissions(participantStatus);
	const isParticipant =
		currentUserId !== undefined && currentUserId !== ""
			? participants.some((participant) => participant.user_id === currentUserId)
			: false;
	const isOwner =
		currentUserId !== undefined &&
		currentUserId !== "" &&
		currentEvent !== undefined &&
		currentUserId === currentEvent.owner_id;
	const shouldShowActions =
		currentUserId !== undefined &&
		currentUserId !== "" &&
		!isOwner &&
		(participantPermissions.canJoin || participantPermissions.canLeave);
	const activeSongName =
		eventPublic?.active_song_id !== undefined && eventPublic.active_song_id !== null
			? (publicSongs[eventPublic.active_song_id]?.song_name ?? eventPublic.active_song_id)
			: undefined;
	const activeSlidePosition =
		typeof eventPublic?.active_slide_position === "number" &&
		Number.isInteger(eventPublic.active_slide_position) &&
		eventPublic.active_slide_position > ZERO
			? eventPublic.active_slide_position
			: undefined;
	const activeSong =
		eventPublic?.active_song_id !== undefined && eventPublic.active_song_id !== null
			? publicSongs[eventPublic.active_song_id]
			: undefined;
	const activeSlideId =
		activeSong !== undefined && activeSlidePosition !== undefined
			? activeSong.slide_order?.[activeSlidePosition - FIRST_POSITION]
			: undefined;
	const activeSlideName =
		activeSong !== undefined && activeSlideId !== undefined
			? (activeSong.slides?.[activeSlideId]?.slide_name ?? activeSlideId)
			: undefined;
	const activeSlide =
		activeSong !== undefined && activeSlideId !== undefined
			? activeSong.slides?.[activeSlideId]
			: undefined;
	const activeSlideDisplayFields =
		activeSong !== undefined && Array.isArray(activeSong.fields) && activeSong.fields.length > ZERO
			? activeSong.fields.map(String)
			: [...songFields];
	const activeSongTotalSlides =
		activeSong !== undefined && Array.isArray(activeSong.slide_order)
			? activeSong.slide_order.length
			: ZERO;
	const displayDate =
		eventPublic?.event_date !== undefined && eventPublic.event_date !== ""
			? utcTimestampToClientLocalDate(eventPublic.event_date)
			: undefined;

	return {
		eventPublic,
		ownerUsername,
		participants,
		participantStatus,
		canViewFullEvent: participantPermissions.canViewFullEvent,
		canViewSlides: participantPermissions.canViewSlides,
		canJoin: participantPermissions.canJoin,
		canLeave: participantPermissions.canLeave,
		isParticipant,
		isOwner,
		shouldShowActions,
		activeSongName,
		activeSlidePosition,
		activeSlideName,
		activeSlide,
		activeSlideDisplayFields,
		activeSongTotalSlides,
		displayDate,
	};
}
