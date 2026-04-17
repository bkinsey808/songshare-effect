import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

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
};


describe("useFetchSongData", () => {
	it("resets form and refs when songId is undefined", async () => {
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: true };

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

		await waitFor(() => {
			expect(hasPopulatedRef.current).toBe(false);
			expect(setIsFetching).toHaveBeenCalledWith(false);
			expect(setIsLoadingData).toHaveBeenCalledWith(false);
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
			expect(clearInitialState).toHaveBeenCalledWith();
		});
	});

	it("resets form when songId is empty string", async () => {
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

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

		await waitFor(() => {
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
		});
	});

	it("triggers fetch when songId is set", async () => {
		const addActivePrivateSongIds = vi.fn(() => Effect.void);
		const addActivePublicSongIds = vi.fn(() => Effect.void);
		const setFormValuesState = vi.fn();
		const setIsLoadingData = vi.fn();
		const setIsFetching = vi.fn();
		const clearInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		const locationWithSong = makeMockLocation("/en/song/song-1/edit", "song-1");
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

		await waitFor(() => {
			expect(addActivePrivateSongIds).toHaveBeenCalledWith(["song-1"]);
			expect(addActivePublicSongIds).toHaveBeenCalledWith(["song-1"]);
			expect(setIsLoadingData).toHaveBeenCalledWith(true);
			expect(setFormValuesState).toHaveBeenCalledWith(EMPTY_FORM_VALUES);
		});
	});
});
