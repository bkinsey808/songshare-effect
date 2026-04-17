import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import { type EventSavePayload } from "@/shared/event/event-save-schema";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { apiEventSavePath, eventViewPath } from "@/shared/paths";

import type { ActionState } from "../ActionState.type";
import refreshEvent from "../refreshEvent";
import runAction from "../runAction";
import computeEventPermissions from "./computeEventPermissions";
import useActiveEventSync from "./useActiveEventSync";
import useEventCommunityManagement from "./useEventCommunityManagement";
import type { UseEventManageStateResult } from "./UseEventManageStateResult.type";
import useEventParticipantManagement from "./useEventParticipantManagement";
import useEventPlaybackManagement from "./useEventPlaybackManagement";
import usePlaylistLibraryManagement from "./usePlaylistLibraryManagement";

/**
 * State & handlers for realtime event management (used by EventManageView).
 *
 * @returns UseEventManageStateResult containing state, handlers, and refs
 */
export default function useEventManageView(): UseEventManageStateResult {
	const { event_slug } = useParams<{ event_slug: string }>();
	const navigate = useNavigate();
	const lang = useCurrentLang();

	const currentEvent = useAppStore((state) => state.currentEvent);
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const isEventLoading = useAppStore((state) => state.isEventLoading);
	const eventError = useAppStore((state) => state.eventError);
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);
	const eventCommunities = useAppStore((state) => state.eventCommunities);
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	const currentEventId = currentEvent?.event_id;
	const eventPublic = currentEvent?.public;
	const participants = currentEvent?.participants ?? [];
	const ownerUsername = currentEvent?.owner_username;
	const ownerId = currentEvent?.owner_id;

	const [actionState, setActionState] = useState<ActionState>({
		loadingKey: undefined,
		error: undefined,
		success: undefined,
	});

	const currentEventIdRef = useRef<string | undefined>(currentEvent?.event_id);

	// Custom hooks for complex data management and subscriptions
	useActiveEventSync({ eventSlug: event_slug });
	usePlaylistLibraryManagement();

	// sync the ref with the latest event id
	useEffect(() => {
		currentEventIdRef.current = currentEvent?.event_id;
	}, [currentEvent?.event_id]);

	// Playback and autosave management
	const {
		selectedActivePlaylistId,
		setSelectedActivePlaylistId,
		activePlaylistIdForSelector,
		activeSongIdForSelector,
		activeSlidePositionForSelector,
		updateActiveSong,
		updateActiveSlidePosition,
	} = useEventPlaybackManagement({
		event_slug,
		fetchEventBySlug,
		eventPublic,
		currentEventIdRef,
		setActionState,
	});

	// reference setter so TypeScript doesn't think it's unused
	void setSelectedActivePlaylistId;

	// Permission logic
	const { canManageEvent } = computeEventPermissions({
		currentUserId,
		ownerId,
		participants,
	});

	// Participant invite/kick management
	const { inviteUserIdInput, onInviteUserSelect, onInviteClick, onKickParticipant } =
		useEventParticipantManagement({
			currentEventId,
			event_slug,
			fetchEventBySlug,
			setActionState,
		});

	// Community linking management
	const {
		addCommunityIdInput,
		onAddCommunityIdSelect,
		onAddCommunityClick,
		onRemoveCommunityClick,
	} = useEventCommunityManagement({
		currentEventId,
		event_slug,
		fetchEventBySlug,
		setActionState,
	});

	const activePlaylistIdForEffect = selectedActivePlaylistId ?? eventPublic?.active_playlist_id;

	// When active playlist changes, fetch its details
	useEffect(() => {
		if (activePlaylistIdForEffect === undefined || activePlaylistIdForEffect === "") {
			// oxlint-disable-next-line no-empty-function -- no fetch when undefined; return fn for React 19 HMR
			return;
		}
		void Effect.runPromise(fetchPlaylistById(activePlaylistIdForEffect));
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [activePlaylistIdForEffect, fetchPlaylistById]);

	/**
	 * Navigate back to the event view page using the current language.
	 *
	 * @returns void
	 */
	function onBackClick(): void {
		if (eventPublic?.event_slug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${eventPublic.event_slug}`, lang));
		}
	}

	if (currentEvent === undefined || eventPublic === undefined) {
		return {
			currentEvent,
			eventPublic,
			participants,
			ownerId,
			ownerUsername,
			isEventLoading,
			eventError,
			canManageEvent,
			actionState,
			inviteUserIdInput,
			activePlaylistIdForSelector,
			activeSongIdForSelector,
			activeSlidePositionForSelector,
			updateActivePlaylist: (_playlistId) => undefined,
			updateActiveSong: (_songId) => undefined,
			updateActiveSlidePosition: (_slidePosition) => undefined,
			onBackClick,
			onInviteClick: () => undefined,
			onInviteUserSelect: (_userId) => undefined,
			onPlaylistSelect: (_playlistId) => undefined,
			onSongSelect: (_songId) => undefined,
			onSlidePositionSelect: (_slidePosition) => undefined,
			onKickParticipant: (_userId) => undefined,
			eventCommunities: [],
			addCommunityIdInput,
			onAddCommunityIdSelect: (_communityId) => undefined,
			onAddCommunityClick: () => undefined,
			onRemoveCommunityClick: (_communityId) => undefined,
		};
	}

	const currentEventIdRequired = currentEvent.event_id;

	/**
	 * Update the active playlist for the current event.
	 *
	 * @param playlistId - playlist id to set (empty string clears)
	 * @returns void
	 */
	function updateActivePlaylist(playlistId: string): void {
		/* oxlint-disable-next-line unicorn/no-null */
		const payload: EventSavePayload = {
			event_id: currentEventIdRequired,
			/* oxlint-disable-next-line unicorn/no-null */
			active_playlist_id: playlistId === "" ? null : playlistId,
		};
		void runAction({
			actionKey: "playlist",
			successMessage: "Active playlist updated",
			action: () => postJson(apiEventSavePath, payload),
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

/**
 * Handler invoked when a playlist is selected from the UI.
 *
 * @param playlistId - id of the selected playlist
 * @returns void
 */
function onPlaylistSelect(playlistId: string): void {
		if (playlistId !== (activePlaylistIdForSelector ?? "")) {
			updateActivePlaylist(playlistId);
		}
	}
/**
 * Handler invoked when a song is selected for playback.
 *
 * @param songId - id of the selected song
 * @returns void
 */
function onSongSelect(songId: string): void {
		if (songId !== (activeSongIdForSelector ?? "")) {
			updateActiveSong(songId);
		}
	}

/**
 * Handler for selecting a slide position in the playlist.
 *
 * @param slidePosition - new slide position or undefined to clear
 * @returns void
 */
function onSlidePositionSelect(slidePosition: number | undefined): void {
	if (slidePosition !== activeSlidePositionForSelector) {
		updateActiveSlidePosition(slidePosition);
	}
}

	return {
		currentEvent,
		eventPublic,
		participants,
		ownerId,
		ownerUsername,
		isEventLoading,
		eventError,
		canManageEvent,
		actionState,
		inviteUserIdInput,
		activePlaylistIdForSelector,
		activeSongIdForSelector,
		activeSlidePositionForSelector,
		updateActivePlaylist,
		updateActiveSong,
		updateActiveSlidePosition,
		onBackClick,
		onInviteClick,
		onInviteUserSelect,
		onPlaylistSelect,
		onSongSelect,
		onSlidePositionSelect,
		onKickParticipant,
		eventCommunities,
		addCommunityIdInput,
		onAddCommunityIdSelect,
		onAddCommunityClick,
		onRemoveCommunityClick,
	};
}
