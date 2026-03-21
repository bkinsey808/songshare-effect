import { act, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeDeferred from "@/react/lib/test-utils/makeDeferred";
import {
	setMockEffectFailValue,
	setMockEffectSucceedValue,
} from "@/react/lib/test-utils/spy-import/spyHelpers";
import saveItemTagsRequest from "@/react/tag-library/saveItemTagsRequest";

import useItemTags from "./useItemTags";

vi.mock("@/react/tag-library/image/fetchItemTagsRequest");
vi.mock("@/react/tag-library/saveItemTagsRequest");

const FETCH_PATH = "@/react/tag-library/image/fetchItemTagsRequest";
const SAVE_PATH = "@/react/tag-library/saveItemTagsRequest";

describe("useItemTags", () => {
	it("returns empty tags and isLoadingTags=false when itemId is undefined", async () => {
		const { result } = renderHook(() => useItemTags("song", undefined));

		await waitFor(() => {
			expect(result.current.tags).toStrictEqual([]);
			expect(result.current.isLoadingTags).toBe(false);
		});
	});

	it("returns empty tags and isLoadingTags=false when itemId is empty string", async () => {
		const { result } = renderHook(() => useItemTags("song", ""));

		await waitFor(() => {
			expect(result.current.tags).toStrictEqual([]);
			expect(result.current.isLoadingTags).toBe(false);
		});
	});

	it("fetches tags on mount when itemId is provided", async () => {
		await setMockEffectSucceedValue(FETCH_PATH, ["rock", "pop"]);

		const { result } = renderHook(() => useItemTags("song", "song-123"));

		await waitFor(() => {
			expect(result.current.tags).toStrictEqual(["rock", "pop"]);
			expect(result.current.isLoadingTags).toBe(false);
		});
	});

	it("sets isLoadingTags=true while fetching then false after", async () => {
		const deferred = makeDeferred<string[]>();

		const fetchSpy = await import("@/react/tag-library/image/fetchItemTagsRequest");
		vi.mocked(fetchSpy.default).mockReturnValue(Effect.promise(() => deferred.promise));

		const { result } = renderHook(() => useItemTags("playlist", "p-1"));

		await waitFor(() => {
			expect(result.current.isLoadingTags).toBe(true);
		});

		act(() => {
			deferred.resolve(["jazz"]);
		});

		await waitFor(() => {
			expect(result.current.isLoadingTags).toBe(false);
			expect(result.current.tags).toStrictEqual(["jazz"]);
		});
	});

	it("setTags updates the tags state", async () => {
		await setMockEffectSucceedValue(FETCH_PATH, []);

		const { result } = renderHook(() => useItemTags("event", undefined));

		act(() => {
			result.current.setTags(["folk", "country"]);
		});

		expect(result.current.tags).toStrictEqual(["folk", "country"]);
	});

	it("saveTags calls saveItemTagsRequest with correct diff", async () => {
		await setMockEffectSucceedValue(FETCH_PATH, ["rock", "pop"]);
		await setMockEffectSucceedValue(SAVE_PATH, undefined);

		const { result } = renderHook(() => useItemTags("song", "song-abc"));

		await waitFor(() => {
			expect(result.current.tags).toStrictEqual(["rock", "pop"]);
		});

		act(() => {
			result.current.setTags(["rock", "jazz"]);
		});

		const saveResult = await act(() => result.current.saveTags("song-abc"));

		expect(vi.mocked(saveItemTagsRequest)).toHaveBeenCalledWith({
			itemType: "song",
			itemId: "song-abc",
			originalTags: ["rock", "pop"],
			nextTags: ["rock", "jazz"],
		});
		expect(saveResult).toStrictEqual({ success: true });
	});

	it("saveTags returns error when saveItemTagsRequest fails", async () => {
		await setMockEffectSucceedValue(FETCH_PATH, []);
		await setMockEffectFailValue(SAVE_PATH, new Error("Network error"));

		const { result } = renderHook(() => useItemTags("image", "img-1"));

		await waitFor(() => {
			expect(result.current.isLoadingTags).toBe(false);
		});

		const saveResult = await act(() => result.current.saveTags("img-1"));

		expect(saveResult).toStrictEqual({ success: false, errorMessage: "Network error" });
	});

	it("re-fetches when itemId changes", async () => {
		await setMockEffectSucceedValue(FETCH_PATH, ["alpha"]);

		const { result, rerender } = renderHook(
			({ id }: { id: string }) => useItemTags("community", id),
			{ initialProps: { id: "c-1" } },
		);

		await waitFor(() => {
			expect(result.current.tags).toStrictEqual(["alpha"]);
		});

		await setMockEffectSucceedValue(FETCH_PATH, ["beta"]);

		rerender({ id: "c-2" });

		await waitFor(() => {
			expect(result.current.tags).toStrictEqual(["beta"]);
		});
	});
});
