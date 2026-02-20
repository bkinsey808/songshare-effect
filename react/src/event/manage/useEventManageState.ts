import { Effect as EffectRuntime } from "effect";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { EventEntry } from "@/react/event/event-types";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
	apiEventSavePath,
	apiEventUserAddPath,
	apiEventUserKickPath,
	eventViewPath,
} from "@/shared/paths";

import usePlaybackAutosaveFlush from "./usePlaybackAutosaveFlush";

const AUTOSAVE_DEBOUNCE_MS = 250;
const FIRST_SLIDE_POSITION = 1;

type ActionState = {
	loadingKey: string | undefined;
	error: string | undefined;
	success: string | undefined;
};

type UseEventManageStateResult = {
	currentEvent: EventEntry | undefined;
	eventPublic: EventEntry["public"];
	participants: EventEntry["participants"];
	ownerId: string | undefined;
	ownerUsername: string | undefined;
	isEventLoading: boolean;
	eventError: string | undefined;
	canManageEvent: boolean;
	actionState: ActionState;
	inviteUserIdInput: string | undefined;
	setInviteUserIdInput: (userId: string | undefined) => void;
	activePlaylistDisplay: string;
	activeSongDisplay: string;
	activeSlideDisplay: string;
	activePlaylistIdForSelector: string | undefined;
	activeSongIdForSelector: string | undefined;
	activeSlidePositionForSelector: number | undefined;
	updateActivePlaylist: (playlistId: string) => void;
	updateActiveSong: (songId: string) => void;
	updateActiveSlidePosition: (slidePosition: number | undefined) => void;
	inviteParticipant: (userId: string) => void;
	kickParticipant: (userId: string) => void;
	goBackToEvent: () => void;
};

/**
 * Provides state and handlers for the event management realtime controls.
 *
 * @returns Data and actions consumed by the EventManageView presentation component
 */
export default function useEventManageState(): UseEventManageStateResult {
	const { event_slug } = useParams<{ event_slug: string }>();
	const navigate = useNavigate();
	const lang = useCurrentLang();
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const subscribeToEvent = useAppStore((state) => state.subscribeToEvent);
	const currentEvent = useAppStore((state) => state.currentEvent);
	const isEventLoading = useAppStore((state) => state.isEventLoading);
	const eventError = useAppStore((state) => state.eventError);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);
	const currentUserId = useCurrentUserId();
	const eventPublic = currentEvent?.public;
	const participants = currentEvent?.participants ?? [];
	const ownerUsername = currentEvent?.owner_username;

	const [selectedActivePlaylistId, setSelectedActivePlaylistId] = useState<string | undefined>(
		undefined,
	);
	const [selectedActiveSongId, setSelectedActiveSongId] = useState<string | undefined>(undefined);
	const [selectedActiveSlidePosition, setSelectedActiveSlidePosition] = useState<
		number | undefined
	>(undefined);
	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);
	const [actionState, setActionState] = useState<ActionState>({
		loadingKey: undefined,
		error: undefined,
		success: undefined,
	});
	const songAutosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const slideAutosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const latestEventIdRef = useRef<string | undefined>(undefined);
	const latestSongIdRef = useRef<string | undefined>(undefined);
	const latestSlidePositionRef = useRef<number | undefined>(undefined);

	usePlaybackAutosaveFlush({
		songAutosaveTimeoutRef,
		slideAutosaveTimeoutRef,
		latestEventIdRef,
		latestSongIdRef,
		latestSlidePositionRef,
	});

	const ownerId = currentEvent?.owner_id;
	const isOwner = currentUserId !== undefined && ownerId !== undefined && currentUserId === ownerId;
	const currentParticipant =
		currentUserId === undefined
			? undefined
			: participants.find((participant) => participant.user_id === currentUserId);
	const isEventAdmin = currentParticipant?.role === "event_admin";
	const canManageEvent = isOwner || isEventAdmin;
	const activePlaylistIdForEffect = selectedActivePlaylistId ?? eventPublic?.active_playlist_id;

	// Fetch the event data whenever the slug changes (skip empty slug)
	useEffect(() => {
		if (event_slug === undefined || event_slug === "") {
			return;
		}

		void EffectRuntime.runPromise(fetchEventBySlug(event_slug));
	}, [event_slug, fetchEventBySlug]);

	// Subscribe to realtime updates for the current event when we have an id
	useEffect(() => {
		const cid = currentEvent?.event_id;
		if (cid === undefined) {
			return;
		}

		const unsubscribe = subscribeToEvent();
		return (): void => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [currentEvent?.event_id, subscribeToEvent]);

	// Load playlist library once so the manager can show playlists for adding songs
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchPlaylistLibrary());
			} catch {
				// Keep manager usable even if playlist library fails to load.
			}
		})();
	}, [fetchPlaylistLibrary]);

	// Load current user's library on mount so we can reference it in the manager
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchUserLibrary());
			} catch {
				// Keep manager usable even if user library fails to load.
			}
		})();
	}, [fetchUserLibrary]);

	// When the active playlist changes, fetch its details so the UI can display it
	useEffect(() => {
		if (activePlaylistIdForEffect === undefined || activePlaylistIdForEffect === "") {
			return;
		}

		void EffectRuntime.runPromise(fetchPlaylistById(activePlaylistIdForEffect));
	}, [activePlaylistIdForEffect, fetchPlaylistById]);

	async function refreshEvent(): Promise<void> {
		if (event_slug !== undefined && event_slug !== "") {
			await EffectRuntime.runPromise(fetchEventBySlug(event_slug));
		}
	}

	async function runAction(
		actionKey: string,
		successMessage: string,
		action: () => Promise<void>,
	): Promise<void> {
		const isPlaybackAction =
			actionKey === "playlist" || actionKey === "song" || actionKey === "slide";
		const shouldRefreshEvent =
			actionKey !== "playlist" && actionKey !== "song" && actionKey !== "slide";
		if (!isPlaybackAction) {
			setActionState({ loadingKey: actionKey, error: undefined, success: undefined });
		}
		try {
			await action();
			if (shouldRefreshEvent) {
				await refreshEvent();
			}
			if (!isPlaybackAction) {
				setActionState({ loadingKey: undefined, error: undefined, success: successMessage });
			}
		} catch (error: unknown) {
			setActionState({
				loadingKey: undefined,
				error: extractErrorMessage(error, "Action failed"),
				success: undefined,
			});
		}
	}

	function goBackToEvent(): void {
		if (eventPublic?.event_slug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${eventPublic.event_slug}`, lang));
		}
	}

	// Always update refs, even if event is not loaded, to comply with React rules
	const currentEventId = currentEvent?.event_id;
	const activePlaylistIdForSelector =
		selectedActivePlaylistId ?? eventPublic?.active_playlist_id ?? undefined;
	const activeSongIdForSelector = selectedActiveSongId ?? eventPublic?.active_song_id ?? undefined;
	const activeSlidePositionForSelector =
		selectedActiveSlidePosition ?? eventPublic?.active_slide_position ?? undefined;

	// Update the mutable refs whenever any of the ids change (avoids stale closures)
	useEffect(() => {
		latestEventIdRef.current = currentEventId;
		latestSongIdRef.current = activeSongIdForSelector;
		latestSlidePositionRef.current = activeSlidePositionForSelector;
	}, [currentEventId, activeSongIdForSelector, activeSlidePositionForSelector]);

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
			setInviteUserIdInput,
			activePlaylistDisplay: "(none)",
			activeSongDisplay: "(none)",
			activeSlideDisplay: "(none)",
			activePlaylistIdForSelector: activePlaylistIdForEffect ?? undefined,
			activeSongIdForSelector: selectedActiveSongId,
			activeSlidePositionForSelector: selectedActiveSlidePosition,
			updateActivePlaylist: (_playlistId) => undefined,
			updateActiveSong: (_songId) => undefined,
			updateActiveSlidePosition: (_slidePosition) => undefined,
			inviteParticipant: (_userId) => undefined,
			kickParticipant: (_userId) => undefined,
			goBackToEvent,
		};
	}

	const currentEventIdRequired = currentEvent.event_id;

	// (moved above)

	function updateActivePlaylist(playlistId: string): void {
		if (songAutosaveTimeoutRef.current !== undefined) {
			clearTimeout(songAutosaveTimeoutRef.current);
			songAutosaveTimeoutRef.current = undefined;
		}
		if (slideAutosaveTimeoutRef.current !== undefined) {
			clearTimeout(slideAutosaveTimeoutRef.current);
			slideAutosaveTimeoutRef.current = undefined;
		}
		setSelectedActivePlaylistId(playlistId);
		void runAction(
			"playlist",
			"Active playlist updated",
			() =>
				/* oxlint-disable unicorn/no-null */
				postJson(apiEventSavePath, {
					event_id: currentEventIdRequired,
					active_playlist_id: playlistId === "" ? null : playlistId,
				}),
			/* oxlint-enable unicorn/no-null */
		);
	}

	function updateActiveSong(songId: string): void {
		const shouldSetFirstSlide = songId !== "" && activeSlidePositionForSelector === undefined;
		latestEventIdRef.current = currentEventIdRequired;
		latestSongIdRef.current = songId === "" ? undefined : songId;
		if (shouldSetFirstSlide) {
			latestSlidePositionRef.current = FIRST_SLIDE_POSITION;
		}

		setSelectedActiveSongId(songId);
		if (shouldSetFirstSlide) {
			setSelectedActiveSlidePosition(FIRST_SLIDE_POSITION);
		}

		if (songAutosaveTimeoutRef.current !== undefined) {
			clearTimeout(songAutosaveTimeoutRef.current);
		}

		songAutosaveTimeoutRef.current = setTimeout(() => {
			const payload: {
				event_id: string;
				active_song_id: string | null;
				active_slide_position?: number | null;
			} = {
				event_id: currentEventIdRequired,
				/* oxlint-disable unicorn/no-null */
				active_song_id: songId === "" ? null : songId,
				/* oxlint-enable unicorn/no-null */
			};

			if (shouldSetFirstSlide) {
				payload.active_slide_position = FIRST_SLIDE_POSITION;
			}

			void runAction("song", "Active song updated", () => postJson(apiEventSavePath, payload));
			songAutosaveTimeoutRef.current = undefined;
		}, AUTOSAVE_DEBOUNCE_MS);
	}

	function updateActiveSlidePosition(slidePosition: number | undefined): void {
		latestEventIdRef.current = currentEventIdRequired;
		latestSlidePositionRef.current = slidePosition;
		setSelectedActiveSlidePosition(slidePosition);
		if (slideAutosaveTimeoutRef.current !== undefined) {
			clearTimeout(slideAutosaveTimeoutRef.current);
		}

		slideAutosaveTimeoutRef.current = setTimeout(() => {
			void runAction(
				"slide",
				"Active slide position updated",
				() =>
					/* oxlint-disable unicorn/no-null */
					postJson(apiEventSavePath, {
						event_id: currentEventIdRequired,
						active_slide_position: slidePosition === undefined ? null : slidePosition,
					}),
				/* oxlint-enable unicorn/no-null */
			);
			slideAutosaveTimeoutRef.current = undefined;
		}, AUTOSAVE_DEBOUNCE_MS);
	}

	function inviteParticipant(userId: string): void {
		void runAction("invite", "Participant invited", async () => {
			await postJson(apiEventUserAddPath, {
				event_id: currentEventIdRequired,
				user_id: userId,
				role: "participant",
				status: "invited",
			});
			setInviteUserIdInput(undefined);
		});
	}

	function kickParticipant(userId: string): void {
		void runAction(`kick:${userId}`, "Participant kicked", () =>
			postJson(apiEventUserKickPath, {
				event_id: currentEventIdRequired,
				user_id: userId,
			}),
		);
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
		setInviteUserIdInput,
		activePlaylistDisplay: activePlaylistIdForSelector ?? "(none)",
		activeSongDisplay: activeSongIdForSelector ?? "(none)",
		activeSlideDisplay:
			typeof activeSlidePositionForSelector === "number"
				? String(activeSlidePositionForSelector)
				: "(none)",
		activePlaylistIdForSelector,
		activeSongIdForSelector,
		activeSlidePositionForSelector,
		updateActivePlaylist,
		updateActiveSong,
		updateActiveSlidePosition,
		inviteParticipant,
		kickParticipant,
		goBackToEvent,
	};
}
