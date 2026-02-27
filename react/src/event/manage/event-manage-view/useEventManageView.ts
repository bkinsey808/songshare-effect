import { Effect as EffectRuntime } from "effect";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

import type { ActionState } from "../ActionState.type";
import type { UseEventManageStateResult } from "./UseEventManageStateResult.type";

import refreshEvent from "../refreshEvent";
import runAction from "../runAction";
import usePlaylistLibraryManagement from "./usePlaylistLibraryManagement";
import useActiveEventSync from "./useActiveEventSync";
import useEventPermissions from "./useEventPermissions";
import useEventPlaybackManagement from "./useEventPlaybackManagement";

/**
 * State & handlers for realtime event management (used by EventManageView).
 */
export default function useEventManageState(): UseEventManageStateResult {
	const { event_slug } = useParams<{ event_slug: string }>();
	const navigate = useNavigate();
	const lang = useCurrentLang();

	const currentEvent = useAppStore((state) => state.currentEvent);
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const isEventLoading = useAppStore((state) => state.isEventLoading);
	const eventError = useAppStore((state) => state.eventError);
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);
	const fetchUserLibrary = useAppStore((state) => state.fetchUserLibrary);
	const currentUserId = useCurrentUserId();

	const eventPublic = currentEvent?.public;
	const participants = currentEvent?.participants ?? [];
	const ownerUsername = currentEvent?.owner_username;
	const ownerId = currentEvent?.owner_id;

	const [inviteUserIdInput, setInviteUserIdInput] = useState<string | undefined>(undefined);
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
	const { canManageEvent } = useEventPermissions({
		currentUserId,
		ownerId,
		participants,
	});

	const activePlaylistIdForEffect = selectedActivePlaylistId ?? eventPublic?.active_playlist_id;

	// Load user library on mount
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await EffectRuntime.runPromise(fetchUserLibrary());
			} catch {
				// Keep manager usable even if user library fails to load
			}
		})();
	}, [fetchUserLibrary]);

	// When active playlist changes, fetch its details
	useEffect(() => {
		if (activePlaylistIdForEffect === undefined || activePlaylistIdForEffect === "") {
			return;
		}
		void EffectRuntime.runPromise(fetchPlaylistById(activePlaylistIdForEffect));
	}, [activePlaylistIdForEffect, fetchPlaylistById]);

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

	function onPlaylistSelect(playlistId: string): void {
		if (playlistId !== (activePlaylistIdForSelector ?? "")) {
			updateActivePlaylist(playlistId);
		}
	}

	function onSongSelect(songId: string): void {
		if (songId !== (activeSongIdForSelector ?? "")) {
			updateActiveSong(songId);
		}
	}

	function onSlidePositionSelect(slidePosition: number | undefined): void {
		if (slidePosition !== activeSlidePositionForSelector) {
			updateActiveSlidePosition(slidePosition);
		}
	}

	function onInviteClick(): void {
		const userId = inviteUserIdInput?.trim() ?? "";
		if (userId === "") {
			return;
		}
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

	function onInviteUserSelect(userId: string | undefined): void {
		setInviteUserIdInput(userId);
	}

	function onKickParticipant(userId: string): void {
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
	};
}
