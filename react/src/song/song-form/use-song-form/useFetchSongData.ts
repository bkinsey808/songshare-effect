import type { useLocation } from "react-router-dom";

import { Effect } from "effect";
import { useEffect } from "react";

import type { SongFormValues } from "../song-form-types";

type UseFetchSongDataParams = {
	readonly songId: string | undefined;
	readonly location: ReturnType<typeof useLocation>;
	readonly addActivePrivateSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	readonly addActivePublicSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	readonly isFetchingRef: React.RefObject<boolean>;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly setIsLoadingData: (loading: boolean) => void;
	readonly setFormValuesState: React.Dispatch<React.SetStateAction<SongFormValues>>;
	readonly clearInitialState: () => void;
};

/**
 * Hook that fetches song data when editing.
 * Handles resetting form state when not editing and triggering data fetch when editing.
 *
 * @returns void
 */
export default function useFetchSongData({
	songId,
	location,
	addActivePrivateSongIds,
	addActivePublicSongIds,
	isFetchingRef,
	hasPopulatedRef,
	setIsLoadingData,
	setFormValuesState,
	clearInitialState,
}: UseFetchSongDataParams): void {
	// Trigger song data fetch or reset form state when songId or location changes
	useEffect(() => {
		if (songId === undefined || songId.trim() === "") {
			hasPopulatedRef.current = false;
			isFetchingRef.current = false;
			setIsLoadingData(false);
			// Reset form values when not editing
			const emptyFormValues: SongFormValues = {
				song_name: "",
				song_slug: "",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				private_notes: "",
			};
			setFormValuesState(emptyFormValues);
			// Reset initial state for new song
			clearInitialState();
			return;
		}

		// Reset populated flag when songId or location changes (forces refresh when navigating back)
		hasPopulatedRef.current = false;
		// Reset initial state when songId changes
		clearInitialState();

		// Clear form values to prevent flash of stale data
		setFormValuesState({
			song_name: "",
			song_slug: "",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			private_notes: "",
		});

		setIsLoadingData(true); // Show loading spinner while fetching fresh data

		// Fetch both private and public song data (this will refresh from database)
		// Run both Effects sequentially using Effect.all
		isFetchingRef.current = true;

		Effect.runFork(
			Effect.all([addActivePrivateSongIds([songId]), addActivePublicSongIds([songId])], {
				concurrency: "unbounded",
			}).pipe(
				Effect.asVoid,
				Effect.tap(() =>
					Effect.sync(() => {
						isFetchingRef.current = false;
					}),
				),
				Effect.catchAll((error) => {
					console.error("[useSongForm] Error fetching song data:", error);
					return Effect.sync(() => {
						isFetchingRef.current = false;
						setIsLoadingData(false);
					});
				}),
			),
		);
	}, [
		songId,
		location.pathname,
		addActivePrivateSongIds,
		addActivePublicSongIds,
		clearInitialState,
		hasPopulatedRef,
		isFetchingRef,
		setIsLoadingData,
		setFormValuesState,
	]);
}
