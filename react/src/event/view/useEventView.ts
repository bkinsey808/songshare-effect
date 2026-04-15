import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { EventParticipant } from "@/react/event/event-entry/EventEntry.type";
import type { EventEntry } from "@/react/event/event-types";
import type { ParticipantStatus } from "@/react/event/participant-status/participantStatusMachine";
import deriveEventViewState from "@/react/event/view/deriveEventViewState";
import useEventActions from "@/react/event/view/useEventActions";
import useEventDataSync from "@/react/event/view/useEventDataSync";
import useEventRealtimeSync from "@/react/event/view/useEventRealtimeSync";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import getSlideOrientationContainerClassName from "@/react/slide-orientation/getSlideOrientationContainerClassName";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import useItemTagsDisplay from "@/react/tag/useItemTagsDisplay";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventViewPath } from "@/shared/paths";

const TOP_BAR_TRIGGER_Y = 96;

/**
 * Hook for managing event view state and actions.
 *
 * Handles fetching event details, auto-joining participants, and managing join/leave actions.
 *
 * @returns Object containing event state, participant info, and action handlers
 */
export default function useEventView(): {
	event_slug: string | undefined;
	currentEvent: EventEntry | undefined;
	eventPublic: EventEntry["public"];
	ownerUsername: string | undefined;
	participants: EventEntry["participants"];
	isEventLoading: boolean;
	eventError: string | undefined;
	participantStatus: ParticipantStatus;
	canViewFullEvent: boolean;
	canViewSlides: boolean;
	canJoin: boolean;
	canLeave: boolean;
	isParticipant: boolean;
	isOwner: boolean;
	shouldShowActions: boolean;
	activeSongName: string | undefined;
	activeSongKey?: ReturnType<typeof deriveEventViewState>["activeSongKey"];
	activeSlidePosition: number | undefined;
	activeSlideName: string | undefined;
	activeSlide: EventEntry["public"] extends undefined
		? undefined
		: ReturnType<typeof deriveEventViewState>["activeSlide"];
	activeSlideDisplayFields: readonly string[];
	activeSongTotalSlides: number;
	displayDate: string | undefined;
	currentUserId: string | undefined;
	currentParticipant: EventParticipant | undefined;
	canManageEvent: boolean;
	eventUrl: string | undefined;
	navigateToEventSubpage: (subpagePath: string) => void;
	isTopBarVisible: boolean;
	slideContainerClassName: string;
	handleBackToEventClick: () => void;
	handleSlideShowMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
	handleSlideShowMouseLeave: () => void;
	actionLoading: boolean;
	actionError: string | undefined;
	actionSuccess: string | undefined;
	handleJoinEvent: () => void;
	handleLeaveEvent: () => void;
	clearActionError: () => void;
	clearActionSuccess: () => void;
	tags: string[];
} {
	const { event_slug } = useParams<{ event_slug: string }>();
	const navigate = useNavigate();
	const lang = useCurrentLang();
	const [isTopBarVisible, setIsTopBarVisible] = useState(false);
	const currentEvent = useAppStore((state) => state.currentEvent);
	const isEventLoading = useAppStore((state) => state.isEventLoading);
	const eventError = useAppStore((state) => state.eventError);
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const appStoreJoinEvent = useAppStore((state) => state.joinEvent);
	const appStoreLeaveEvent = useAppStore((state) => state.leaveEvent);
	const setCurrentEvent = useAppStore((state) => state.setCurrentEvent);
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);
	const publicSongs = useAppStore((state) => state.publicSongs);
	const currentUsername = useAppStore((state) => state.userSessionData?.userPublic.username);
	const currentUserId = useCurrentUserId();
	const { effectiveSlideOrientation } = useSlideOrientationPreference();
	const slideContainerClassName = getSlideOrientationContainerClassName(effectiveSlideOrientation);

	const derivedState = deriveEventViewState({
		currentEvent,
		currentUserId,
		publicSongs,
	});

	useEventDataSync({
		eventSlug: event_slug,
		activePlaylistId: derivedState.eventPublic?.active_playlist_id,
		fetchEventBySlug,
		fetchPlaylistById,
	});

	useEventRealtimeSync({
		eventSlug: event_slug,
		eventId: currentEvent?.event_id,
		currentUserId,
		fetchEventBySlug,
	});

	const tags = useItemTagsDisplay("event", currentEvent?.event_id);

	const actionState = useEventActions({
		currentEvent,
		currentUserId,
		currentUsername,
		setCurrentEvent,
		joinEvent: appStoreJoinEvent,
		leaveEvent: appStoreLeaveEvent,
	});

	const eventSlug = derivedState.eventPublic?.event_slug;
	const eventUrl =
		eventSlug === undefined ? undefined : buildPublicWebUrl(`/${eventViewPath}/${eventSlug}`, lang);

	function navigateToEventSubpage(subpagePath: string): void {
		if (eventSlug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${eventSlug}/${subpagePath}`, lang));
		}
	}

/**
 * Navigate to a named subpage for the current event slug.
 *
 * @param subpagePath - subpath under the event view to navigate to
 * @returns void
 */


	function handleBackToEventClick(): void {
		if (eventSlug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${eventSlug}`, lang));
		}
	}

/**
 * Navigate back to the main event view.
 *
 * @returns void
 */


	function handleSlideShowMouseMove(event: React.MouseEvent<HTMLDivElement>): void {
		setIsTopBarVisible(event.clientY <= TOP_BAR_TRIGGER_Y);
	}

/**
 * Show or hide the top bar based on mouse vertical position.
 *
 * @param event - mouse move event from the slide show container
 * @returns void
 */


	function handleSlideShowMouseLeave(): void {
		setIsTopBarVisible(false);
	}

/**
 * Hide the top bar when the mouse leaves the slide show area.
 *
 * @returns void
 */

	return {
		event_slug,
		currentEvent,
		eventPublic: derivedState.eventPublic,
		ownerUsername: derivedState.ownerUsername,
		participants: derivedState.participants,
		isEventLoading,
		eventError,
		participantStatus: derivedState.participantStatus,
		canViewFullEvent: derivedState.canViewFullEvent,
		canViewSlides: derivedState.canViewSlides,
		canJoin: derivedState.canJoin,
		canLeave: derivedState.canLeave,
		isParticipant: derivedState.isParticipant,
		isOwner: derivedState.isOwner,
		shouldShowActions: derivedState.shouldShowActions,
		activeSongName: derivedState.activeSongName,
		activeSongKey: derivedState.activeSongKey,
		activeSlidePosition: derivedState.activeSlidePosition,
		activeSlideName: derivedState.activeSlideName,
		activeSlide: derivedState.activeSlide,
		activeSlideDisplayFields: derivedState.activeSlideDisplayFields,
		activeSongTotalSlides: derivedState.activeSongTotalSlides,
		displayDate: derivedState.displayDate,
		currentUserId,
		actionLoading: actionState.actionLoading,
		actionError: actionState.actionError,
		actionSuccess: actionState.actionSuccess,
		handleJoinEvent: actionState.handleJoinEvent,
		handleLeaveEvent: actionState.handleLeaveEvent,
		clearActionError: actionState.clearActionError,
		clearActionSuccess: actionState.clearActionSuccess,
		// Derived values used by UI logic
		currentParticipant:
			currentUserId === undefined
				? undefined
				: (derivedState.participants ?? []).find(
						(participant) => participant.user_id === currentUserId,
					),
		canManageEvent:
			derivedState.isOwner ||
			(currentUserId === undefined
				? false
				: (derivedState.participants ?? []).some(
						(participant) =>
							participant.user_id === currentUserId && participant.role === "event_admin",
					)),
		eventUrl,
		navigateToEventSubpage,
		isTopBarVisible,
		slideContainerClassName,
		handleBackToEventClick,
		handleSlideShowMouseMove,
		handleSlideShowMouseLeave,
		tags,
	};
}
