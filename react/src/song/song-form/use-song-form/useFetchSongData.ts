import { Effect } from "effect";
import { useEffect } from "react";
import type { useLocation } from "react-router-dom";

import type { SongFormValues } from "../song-form-types";
import createEmptySongFormValues from "./createEmptySongFormValues";

type UseFetchSongDataParams = {
	readonly songId: string | undefined;
	readonly location: ReturnType<typeof useLocation>;
	readonly addActivePrivateSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	readonly addActivePublicSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	readonly setIsFetching: (value: boolean) => void;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly setIsLoadingData: (loading: boolean) => void;
	readonly setFormValuesState: React.Dispatch<React.SetStateAction<SongFormValues>>;
	readonly clearInitialState: () => void;
};

/**
 * Hook that fetches song data when editing.
 * Handles resetting form state when not editing and triggering data fetch when editing.
 *
 * @param songId - Optional song id being edited
 * @param location - Router location object used to detect navigation changes
 * @param addActivePrivateSongIds - Effect to fetch/refresh private song data
 * @param addActivePublicSongIds - Effect to fetch/refresh public song data
 * @param setIsFetching - Setter to track fetching state
 * @param hasPopulatedRef - Ref used to avoid re-fetch/populate loops
 * @param setIsLoadingData - Setter to toggle loading spinner state
 * @param setFormValuesState - Setter for controlled form values state
 * @param clearInitialState - Callback to clear the initial state snapshot
 * @returns void
 */
export default function useFetchSongData({
	songId,
	location,
	addActivePrivateSongIds,
	addActivePublicSongIds,
	setIsFetching,
	hasPopulatedRef,
	setIsLoadingData,
	setFormValuesState,
	clearInitialState,
}: UseFetchSongDataParams): void {
	// Trigger song data fetch or reset form state when songId or location changes
	useEffect(() => {
		if (songId === undefined || songId.trim() === "") {
			hasPopulatedRef.current = false;
			setIsFetching(false);
			setIsLoadingData(false);
			// Reset form values when not editing
			setFormValuesState(createEmptySongFormValues());
			// Reset initial state for new song
			clearInitialState();
			return;
		}

		// Reset populated flag when songId or location changes (forces refresh when navigating back)
		hasPopulatedRef.current = false;
		// Reset initial state when songId changes
		clearInitialState();

		// Clear form values to prevent flash of stale data
		setFormValuesState(createEmptySongFormValues());

		setIsLoadingData(true); // Show loading spinner while fetching fresh data

		// Fetch both private and public song data (this will refresh from database)
		// Run both Effects concurrently using Effect.all
		setIsFetching(true);

		Effect.runFork(
			Effect.all([addActivePrivateSongIds([songId]), addActivePublicSongIds([songId])], {
				concurrency: "unbounded",
			}).pipe(
				Effect.asVoid,
				Effect.tap(() =>
					Effect.sync(() => {
						setIsFetching(false);
					}),
				),
				Effect.catchAll((error) => {
					console.error("[useSongForm] Error fetching song data:", error);
					return Effect.sync(() => {
						setIsFetching(false);
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
		setIsFetching,
		setIsLoadingData,
		setFormValuesState,
	]);
}
