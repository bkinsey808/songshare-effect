import { Effect as EffectRuntime } from "effect";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { EventEntry } from "@/react/event/event-types";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import {
	apiEventSavePath,
	apiEventUserAddPath,
	apiEventUserKickPath,
	eventViewPath,
} from "@/shared/paths";

import type { ActionState } from "./ActionState.type";

import refreshEvent from "./refreshEvent";
import runAction from "./runAction";
import useEventAutosave from "./useEventAutosave";
import usePlaybackAutosaveFlush from "./usePlaybackAutosaveFlush";
import usePlaybackSelectionSync from "./usePlaybackSelectionSync";

const PUBLIC_SUB_INITIAL_RUN = 0;

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

// State & handlers for realtime event management (used by EventManageView)
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
	const subscribeToPlaylistLibrary = useAppStore((state) => state.subscribeToPlaylistLibrary);
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const subscribeToPlaylistPublic = useAppStore((state) => state.subscribeToPlaylistPublic);
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);
	const currentUserId = useCurrentUserId();
	const eventPublic = currentEvent?.public;
	const participants = currentEvent?.participants ?? [];
	const ownerUsername = currentEvent?.owner_username;

	const [selectedActivePlaylistId, setSelectedActivePlaylistId] = useState<string | undefined>(
		undefined,
	);
	// reference setter so TypeScript doesn't think it's unused (it is used later)
	void setSelectedActivePlaylistId;
	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);
	const [actionState, setActionState] = useState<ActionState>({
		loadingKey: undefined,
		error: undefined,
		success: undefined,
	});
	const latestSlidePositionRef = useRef<number | undefined>(undefined);
	const currentEventIdRef = useRef<string | undefined>(currentEvent?.event_id);

	// sync the ref with the latest event id so helpers defined outside of
	// render (e.g. callbacks in useEventAutosave) can always read a current value
	// without recreating the callback.
	useEffect(() => {
		currentEventIdRef.current = currentEvent?.event_id;
	}, [currentEvent?.event_id]);

	// playback autosave logic handled by a dedicated hook to keep this file
	// focused on the broader event management state.
	const {
		selectedActiveSongId,
		selectedActiveSlidePosition,
		setSelectedSongId,
		setSelectedSlidePosition,
		updateActiveSong,
		updateActiveSlidePosition,
		throttledSongSaveFlush,
		throttledSlideSaveFlush,
	} = useEventAutosave({
		event_slug,
		fetchEventBySlug,
		currentEventIdRef,
		latestSlidePositionRef,
		setActionState,
	});

	// flush callbacks ensure any pending throttled updates are sent on unload
	usePlaybackAutosaveFlush({
		flushSong: throttledSongSaveFlush,
		flushSlide: throttledSlideSaveFlush,
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
	// and subscribe to updates so real‑time changes on other pages propagate here.
	useEffect(() => {
		let unsubscribe: (() => void) | undefined = undefined;

		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchPlaylistLibrary());
			} catch {
				// Keep manager usable even if playlist library fails to load.
			}

			// subscribe to library updates after initial fetch so the list stays fresh
			try {
				unsubscribe = await EffectRuntime.runPromise(subscribeToPlaylistLibrary());
			} catch (error: unknown) {
				// subscription is nice‑to‑have but not critical
				console.error("[useEventManageState] playlist library subscription failed:", error);
			}
		})();

		return (): void => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [fetchPlaylistLibrary, subscribeToPlaylistLibrary]);

	// keep public metadata for any playlists in the library up to date
	const playlistIdsKey = Object.keys(playlistLibraryEntries).toSorted().join(",");
	const publicUnsubRef = useRef<(() => void) | undefined>(undefined);
	const publicRunRef = useRef(PUBLIC_SUB_INITIAL_RUN);

	// subscribe to public metadata for any playlists currently in the
	// user's library. this mirrors the logic in usePlaylistLibrary so the
	// dropdown can display up‑to‑date names when libraries change.
	useEffect(() => {
		const playlistIds = playlistIdsKey.split(",").filter((id) => id !== "");
		const MIN_IDS = 1;

		if (playlistIds.length < MIN_IDS) {
			publicUnsubRef.current = undefined;
			return undefined;
		}

		const run = (publicRunRef.current += 1);
		void (async (): Promise<void> => {
			try {
				const unsubscribe = await EffectRuntime.runPromise(subscribeToPlaylistPublic(playlistIds));
				if (run === publicRunRef.current) {
					publicUnsubRef.current = unsubscribe;
				} else {
					unsubscribe();
				}
			} catch (error: unknown) {
				console.error("[useEventManageState] playlist public subscription failed:", error);
			}
		})();

		return (): void => {
			const fn = publicUnsubRef.current;
			publicUnsubRef.current = undefined;
			if (fn !== undefined) {
				fn();
			}
		};
	}, [playlistIdsKey, subscribeToPlaylistPublic]);

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

	function goBackToEvent(): void {
		if (eventPublic?.event_slug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${eventPublic.event_slug}`, lang));
		}
	}

	// Always update refs, even if event is not loaded, to comply with React rules
	const activePlaylistIdForSelector =
		selectedActivePlaylistId ?? eventPublic?.active_playlist_id ?? undefined;
	const activeSongIdForSelector = selectedActiveSongId ?? eventPublic?.active_song_id ?? undefined;
	const activeSlidePositionForSelector =
		selectedActiveSlidePosition ?? eventPublic?.active_slide_position ?? undefined;

	// keep slide position ref in sync with the selector value
	useEffect(() => {
		latestSlidePositionRef.current = activeSlidePositionForSelector;
	}, [activeSlidePositionForSelector]);

	// keep local song/slide selections in sync with backend
	usePlaybackSelectionSync({
		eventPublic,
		selectedSongId: selectedActiveSongId,
		selectedSlidePosition: selectedActiveSlidePosition,
		setSelectedSongId,
		setSelectedSlidePosition,
	});

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

	function updateActivePlaylist(playlistId: string): void {
		void runAction({
			actionKey: "playlist",
			successMessage: "Active playlist updated",
			action: () =>
				/* oxlint-disable unicorn/no-null */
				postJson(apiEventSavePath, {
					event_id: currentEventIdRequired,
					active_playlist_id: playlistId === "" ? null : playlistId,
				}),
			/* oxlint-enable unicorn/no-null */
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	function inviteParticipant(userId: string): void {
		void runAction({
			actionKey: "invite",
			successMessage: "Participant invited",
			action: async () => {
				await postJson(apiEventUserAddPath, {
					event_id: currentEventIdRequired,
					user_id: userId,
					role: "participant",
					status: "invited",
				});
				setInviteUserIdInput(undefined);
			},
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	function kickParticipant(userId: string): void {
		void runAction({
			actionKey: `kick:${userId}`,
			successMessage: "Participant kicked",
			action: () =>
				postJson(apiEventUserKickPath, {
					event_id: currentEventIdRequired,
					user_id: userId,
				}),
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
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
