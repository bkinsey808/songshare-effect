import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { apiPlaylistLibraryRemovePath } from "@/shared/paths";

import type { RemovePlaylistFromLibraryRequest } from "../slice/playlist-library-types";
import type { PlaylistLibrarySlice } from "../slice/PlaylistLibrarySlice.type";
import removePlaylistFromLibrary from "./removePlaylistFromLibrary";

const PLAYLIST_ID = "playlist-123";

vi.mock(
	"@/react/share/effects/rejectAcceptedSharesForItem",
	(): { default: () => Effect.Effect<void> } => ({
		default: (): Effect.Effect<void> => Effect.succeed(undefined),
	}),
);

describe("removePlaylistFromLibrary", () => {
	it("fails when request has no playlist_id", async () => {
		const setPlaylistLibraryError = vi.fn();

		/**
		 * Return a fake `PlaylistLibrarySlice` for the test where the playlist exists.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				setPlaylistLibraryError,
				isInPlaylistLibrary: vi.fn(() => true),
				removePlaylistLibraryEntry: vi.fn(),
			});
		}

		const invalidRequest = forceCast<RemovePlaylistFromLibraryRequest>({});

		await expect(Effect.runPromise(removePlaylistFromLibrary(invalidRequest, get))).rejects.toThrow(
			/missing playlist_id/,
		);

		expect(setPlaylistLibraryError).toHaveBeenCalledWith(expect.any(String));
	});

	it("exits early when playlist not in library", async () => {
		const removePlaylistLibraryEntry = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		vi.stubGlobal("fetch", vi.fn());

		/**
		 * Return a fake `PlaylistLibrarySlice` for the test where the playlist is not present.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				setPlaylistLibraryError: vi.fn(),
				isInPlaylistLibrary: vi.fn(() => false),
				removePlaylistLibraryEntry,
			});
		}

		await Effect.runPromise(removePlaylistFromLibrary({ playlist_id: PLAYLIST_ID }, get));

		expect(removePlaylistLibraryEntry).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		warnSpy.mockRestore();
		vi.unstubAllGlobals();
	});

	it("removes from local state and calls API when playlist in library", async () => {
		const removePlaylistLibraryEntry = vi.fn();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(undefined, { status: 200 })));
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		/**
		 * Return a fake `PlaylistLibrarySlice` for the test where removal should proceed.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				setPlaylistLibraryError: vi.fn(),
				isInPlaylistLibrary: vi.fn(() => true),
				removePlaylistLibraryEntry,
			});
		}

		await Effect.runPromise(removePlaylistFromLibrary({ playlist_id: PLAYLIST_ID }, get));

		expect(removePlaylistLibraryEntry).toHaveBeenCalledWith(PLAYLIST_ID);
		expect(fetch).toHaveBeenCalledWith(apiPlaylistLibraryRemovePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ playlist_id: PLAYLIST_ID }),
			credentials: "include",
		});

		warnSpy.mockRestore();
		vi.unstubAllGlobals();
	});
});
