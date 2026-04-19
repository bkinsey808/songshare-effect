import { type ChangeEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useActiveSongSelectionState from "@/react/event/form/useActiveSongSelectionState";
import useEventView from "@/react/event/view/useEventView";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { eventViewPath } from "@/shared/paths";

import useEventManageView from "../event-manage-view/useEventManageView";

// utility constants
const NO_SLIDES = 0;
const FIRST_SLIDE = 1;
const ONE = 1;
const FIRST_SONG_INDEX = 0;

/**
 * State returned by `useSlideManagerView`.
 *
 * The hook composes existing event hooks to keep the manager in sync with the
 * backend (realtime subscriptions, autosaves, etc.) while exposing only the
 * pieces required by the slide manager UI.
 */
export type UseSlideManagerViewResult = {
	activePlaylistId: string | undefined;
	activeSongId: string | undefined;
	activeSlidePosition: number | undefined;
	activeSongTotalSlides: number;

	// full list of songs and slides so the UI can render dropdowns/numeric inputs
	availablePlaylistSongs: readonly { songId: string; songName: string }[];
	availableSongSlidePositions: readonly { slideId: string; position: number; slideName: string }[];

	// derived helpers used by SlideManagerView
	currentSongIndex: number;

	// constants exported so views don't need to recreate them
	FIRST_SLIDE: number;
	maxSlide: number;

	// navigation helpers for slides
	goToFirstSlide: () => void;
	goToPrevSlide: () => void;
	goToNextSlide: () => void;
	goToLastSlide: () => void;
	/**
	 * Called when the slide dropdown changes. value is the positive-number
	 * position (1-based) which we forward directly to the manager update fn.
	 */
	handleSlideSelectChange: (evt: ChangeEvent<HTMLSelectElement>) => void;

	// navigation helpers for songs
	goToFirstSong: () => void;
	goToPrevSong: () => void;
	goToNextSong: () => void;
	goToLastSong: () => void;
	handleSongSelectChange: (evt: ChangeEvent<HTMLSelectElement>) => void;

	updateActiveSong: (songId: string) => void;
	updateActiveSlidePosition: (slidePosition: number | undefined) => void;

	/**
	 * Whether the current user has permission to view/use the slide manager.
	 * Owners, event admins, and playlist admins all qualify.
	 */
	canAccess: boolean;
};

export type UseSlideManagerViewOpts = {
	eventSlugOverride?: string;
};

/**
 * Hook composing manage/view hooks to provide the slide manager UI state.
 *
 * @param opts - optional overrides for hook behavior
 * @returns state, helpers, and constants used by SlideManagerView
 */
export default function useSlideManagerView(
	opts?: UseSlideManagerViewOpts,
): UseSlideManagerViewResult {
	const eventManage = useEventManageView();
	const eventView = useEventView();
	const currentUserId = useCurrentUserId();

	// redirect helpers consumed by view when access revoked
	const navigate = useNavigate();
	const lang = useCurrentLang();
	const params = useParams<{ event_slug: string }>();
	const event_slug = opts?.eventSlugOverride ?? params.event_slug;

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
					(participant: { user_id: string; role?: string }) =>
						participant.user_id === currentUserId,
				);
	const isPlaylistAdmin = currentParticipant?.role === "event_playlist_admin";

	const canAccess = eventManage.canManageEvent || isPlaylistAdmin;

	// if permission is lost or missing, navigate away from manager view
	useEffect(() => {
		if (!canAccess && event_slug !== undefined) {
			void navigate(buildPathWithLang(`/${eventViewPath}/${event_slug}`, lang));
		}
	}, [canAccess, event_slug, navigate, lang]);

	const songCount = availablePlaylistSongs.length;
	const lastSongIndex = songCount - FIRST_SLIDE;
	const noSlides = availableSongSlidePositions.length === NO_SLIDES;
	const maxSlide: number = availableSongSlidePositions.length;

	// compute current song index so callers do not duplicate logic
	const currentSongIndex = availablePlaylistSongs.findIndex(
		(song) => song.songId === eventManage.eventPublic?.active_song_id,
	);

	/**
	 * Clamp a positive slide position into the valid range.
	 *
	 * @param pos - candidate 1-based slide position
	 * @returns clamped slide position
	 */
	function clampSlide(pos: number): number {
		if (noSlides) {
			return pos;
		}
		return Math.min(Math.max(pos, FIRST_SLIDE), maxSlide);
	}

	/**
	 * Update active song index by looking up the corresponding id.
	 *
	 * @param idx - zero-based index into `availablePlaylistSongs`
	 * @returns void
	 */
	function updateSongIndex(idx: number): void {
		const song = availablePlaylistSongs.at(idx);
		if (song) {
			eventManage.updateActiveSong(song.songId);
		}
	}

	/**
	 * Navigate to the first slide.
	 *
	 * @returns void
	 */
	function goToFirstSlide(): void {
		eventManage.updateActiveSlidePosition(FIRST_SLIDE);
	}

	/**
	 * Navigate to the previous slide (clamped).
	 *
	 * @returns void
	 */
	function goToPrevSlide(): void {
		eventManage.updateActiveSlidePosition(
			eventView.activeSlidePosition === undefined
				? FIRST_SLIDE
				: clampSlide(eventView.activeSlidePosition - FIRST_SLIDE),
		);
	}

	/**
	 * Navigate to the next slide (clamped).
	 *
	 * @returns void
	 */
	function goToNextSlide(): void {
		eventManage.updateActiveSlidePosition(
			eventView.activeSlidePosition === undefined
				? FIRST_SLIDE
				: clampSlide(eventView.activeSlidePosition + FIRST_SLIDE),
		);
	}

	/**
	 * Navigate to the last slide.
	 *
	 * @returns void
	 */
	function goToLastSlide(): void {
		eventManage.updateActiveSlidePosition(maxSlide);
	}

	/**
	 * Handle slide dropdown change by forwarding numeric position.
	 *
	 * @param evt - change event from slide select element
	 * @returns void
	 */
	function handleSlideSelectChange(evt: ChangeEvent<HTMLSelectElement>): void {
		const parsed = Number.parseInt(evt.target.value, 10);
		if (!Number.isNaN(parsed)) {
			eventManage.updateActiveSlidePosition(parsed);
		}
	}

	/**
	 * Navigate to the first song in the playlist.
	 *
	 * @returns void
	 */
	function goToFirstSong(): void {
		updateSongIndex(FIRST_SONG_INDEX);
	}

	/**
	 * Navigate to the previous song.
	 *
	 * @returns void
	 */
	function goToPrevSong(): void {
		updateSongIndex(currentSongIndex - ONE);
	}

	/**
	 * Navigate to the next song.
	 *
	 * @returns void
	 */
	function goToNextSong(): void {
		updateSongIndex(currentSongIndex + ONE);
	}

	/**
	 * Navigate to the last song.
	 *
	 * @returns void
	 */
	function goToLastSong(): void {
		updateSongIndex(lastSongIndex);
	}

	/**
	 * Handle song dropdown change by forwarding the chosen index.
	 *
	 * @param evt - change event from song select element
	 * @returns void
	 */
	function handleSongSelectChange(evt: ChangeEvent<HTMLSelectElement>): void {
		updateSongIndex(Number(evt.target.value));
	}

	return {
		activePlaylistId: eventManage.eventPublic?.active_playlist_id,
		activeSongId: eventManage.eventPublic?.active_song_id,
		activeSlidePosition: eventView.activeSlidePosition,
		activeSongTotalSlides: eventView.activeSongTotalSlides,
		availablePlaylistSongs,
		availableSongSlidePositions,

		currentSongIndex,

		// expose constants formerly declared in view
		FIRST_SLIDE,
		maxSlide,

		goToFirstSlide,
		goToPrevSlide,
		goToNextSlide,
		goToLastSlide,
		handleSlideSelectChange,

		goToFirstSong,
		goToPrevSong,
		goToNextSong,
		goToLastSong,
		handleSongSelectChange,

		updateActiveSong: eventManage.updateActiveSong,
		updateActiveSlidePosition: eventManage.updateActiveSlidePosition,
		canAccess,
	};
}
