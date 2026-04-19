import { render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeMockLocation from "@/react/lib/test-utils/makeMockLocation.test-util";

import useFetchSongData from "./useFetchSongData";

const MOCK_LOCATION_NEW = makeMockLocation("/en/song/new/edit", "default");

const EMPTY_FORM_VALUES = {
	song_name: "",
	song_slug: "",
	key: "",
	short_credit: "",
	long_credit: "",
	public_notes: "",
	private_notes: "",
	lyrics: ["en"],
	script: [],
	translations: [],
	chords: [],
};

/**
 * Harness for useFetchSongData.
 *
 * @param songId - The current song ID
 * @param hasPopulatedRef - Ref tracking if the form has been populated
 * @param setIsFetching - Function to set fetching state
 * @param setIsLoadingData - Function to set data loading state
 * @param setFormValuesState - Function to update form values state
 * @param clearInitialState - Function to clear the initial form state
 * @returns A small DOM fragment
 */
function Harness({
	songId,
	hasPopulatedRef,
	setIsFetching,
	setIsLoadingData,
	setFormValuesState,
	clearInitialState,
}: {
	readonly songId: string | undefined;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly setIsFetching: (val: boolean) => void;
	readonly setIsLoadingData: (val: boolean) => void;
	readonly setFormValuesState: (val: unknown) => void;
	readonly clearInitialState: () => void;
}): ReactElement {
	useFetchSongData({
		songId,
		location: MOCK_LOCATION_NEW,
		addActivePrivateSongIds: vi.fn(() => Effect.void),
		addActivePublicSongIds: vi.fn(() => Effect.void),
		setIsFetching,
		hasPopulatedRef,
		setIsLoadingData,
		setFormValuesState,
		clearInitialState,
	});
	return <div data-testid="harness">Harness</div>;
}

describe("useFetchSongData — renderHook", () => {
	it("resets form and refs when songId is undefined", async () => {
		// Arrange
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: true };

		// Act
		renderHook(() => {
			useFetchSongData({
				songId: undefined,
				location: MOCK_LOCATION_NEW,
				addActivePrivateSongIds: vi.fn(() => Effect.void),
				addActivePublicSongIds: vi.fn(() => Effect.void),
				setIsFetching,
				hasPopulatedRef,
				setIsLoadingData,
				setFormValuesState,
				clearInitialState,
			});
		});

		// Assert
		await waitFor(() => {
			expect(hasPopulatedRef.current).toBe(false);
			expect(setIsFetching).toHaveBeenCalledWith(false);
			expect(setIsLoadingData).toHaveBeenCalledWith(false);
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
			expect(clearInitialState).toHaveBeenCalledWith();
		});
	});

	it("resets form when songId is empty string", async () => {
		// Arrange
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		// Act
		renderHook(() => {
			useFetchSongData({
				songId: "",
				location: MOCK_LOCATION_NEW,
				addActivePrivateSongIds: vi.fn(() => Effect.void),
				addActivePublicSongIds: vi.fn(() => Effect.void),
				setIsFetching,
				hasPopulatedRef,
				setIsLoadingData,
				setFormValuesState,
				clearInitialState,
			});
		});

		// Assert
		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
		});
	});

	it("triggers fetch when songId is set", async () => {
		// Arrange
		const addActivePrivateSongIds = vi.fn(() => Effect.void);
		const addActivePublicSongIds = vi.fn(() => Effect.void);
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		const locationWithSong = makeMockLocation("/en/song/song-1/edit", "song-1");

		// Act
		renderHook(() => {
			useFetchSongData({
				songId: "song-1",
				location: locationWithSong,
				addActivePrivateSongIds,
				addActivePublicSongIds,
				setIsFetching,
				hasPopulatedRef,
				setIsLoadingData,
				setFormValuesState,
				clearInitialState,
			});
		});

		// Assert
		await waitFor(() => {
			expect(addActivePrivateSongIds).toHaveBeenCalledWith(["song-1"]);
			expect(addActivePublicSongIds).toHaveBeenCalledWith(["song-1"]);
			expect(setIsLoadingData).toHaveBeenCalledWith(true);
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
		});
	});
});

describe("useFetchSongData — Harness", () => {
	it("triggers reset in harness when songId is undefined", async () => {
		// Arrange
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: true };

		// Act
		render(
			<Harness
				songId={undefined}
				hasPopulatedRef={forceCast<React.RefObject<boolean>>(hasPopulatedRef)}
				setIsFetching={setIsFetching}
				setIsLoadingData={setIsLoadingData}
				setFormValuesState={setFormValuesState}
				clearInitialState={clearInitialState}
			/>,
		);

		// Assert
		await waitFor(() => {
			expect(hasPopulatedRef.current).toBe(false);
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
		});
	});
});
