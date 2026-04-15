import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { clientWarn } from "@/react/lib/utils/clientLogger";
import type {
    AddPlaylistToLibraryRequest,
    PlaylistLibraryEntry,
} from "@/react/playlist-library/slice/playlist-library-types";
import type { PlaylistLibrarySlice } from "@/react/playlist-library/slice/PlaylistLibrarySlice.type";
import acceptPendingSharesForItem from "@/react/share/effects/acceptPendingSharesForItem";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import guardAsAddPlaylistRequest from "../guards/guardAsAddPlaylistRequest";
import guardAsPlaylistLibraryEntry from "../guards/guardAsPlaylistLibraryEntry";
import addPlaylistToLibrary from "./addPlaylistToLibrary";

vi.mock("@/react/share/effects/acceptPendingSharesForItem");
vi.mock("@/react/lib/utils/clientLogger");
vi.mock("@/shared/error-message/extractErrorMessage");
vi.mock("../guards/guardAsAddPlaylistRequest");
vi.mock("../guards/guardAsPlaylistLibraryEntry");

/**
 * Temporarily replaces global fetch with a mock, runs the test, and restores fetch.
 * Ensures cleanup even when the test throws.
 */
/**
 * Temporarily replaces global fetch with a mock, runs the test, and restores fetch.
 * Ensures cleanup even when the test throws.
 *
 * @param mockImpl - Factory that returns a `vi.fn` mock for `fetch`
 * @param testFn - Async test function to execute while `fetch` is mocked
 * @returns Promise that resolves when the test completes
 */
async function withFetchMock(
	mockImpl: () => ReturnType<typeof vi.fn>,
	testFn: () => Promise<void>,
): Promise<void> {
	vi.resetAllMocks();
	const originalFetch = globalThis.fetch;
	vi.stubGlobal("fetch", mockImpl());
	try {
		await testFn();
	} finally {
		vi.stubGlobal("fetch", originalFetch);
	}
}

/**
 * Builds a get function that returns a playlist library slice with the given mock methods.
 * Used to isolate addPlaylistToLibrary from full store setup.
 *
 * @param setPlaylistLibraryError - Mock for setting an error on the slice
 * @param isInPlaylistLibrary - Mock predicate for membership
 * @param addPlaylistLibraryEntry - Mock for adding an entry
 * @returns A `get` function that returns the mocked `PlaylistLibrarySlice`
 */
function makeGet(
	setPlaylistLibraryError: ReturnType<typeof vi.fn>,
	isInPlaylistLibrary: ReturnType<typeof vi.fn>,
	addPlaylistLibraryEntry: ReturnType<typeof vi.fn>,
): () => PlaylistLibrarySlice {
	return function get(): PlaylistLibrarySlice {
		return forceCast<PlaylistLibrarySlice>({
			setPlaylistLibraryError,
			isInPlaylistLibrary,
			addPlaylistLibraryEntry,
		});
	};
}

/**
 * Install a simple `extractErrorMessage` mock for tests.
 *
 * @returns void
 */
function installExtractErrorMessageMock(): void {
	vi.mocked(extractErrorMessage).mockImplementation((err: unknown, def: string): string =>
		typeof err === "string" ? err : def,
	);
}

describe("addPlaylistToLibrary", () => {
	it("posts to API and adds entry when server returns a valid playlist entry", async () => {
		const request: AddPlaylistToLibraryRequest = {
			playlist_id: "p1",
		};
		const serverData = forceCast<PlaylistLibraryEntry>({
			playlist_id: "p1",
			user_id: "u1",
			created_at: "2025-01-01T00:00:00Z",
		});

		await withFetchMock(
			() =>
				vi.fn().mockResolvedValue({
					ok: true,
					status: 200,
					statusText: "OK",
					json: (): Promise<{ data: PlaylistLibraryEntry }> =>
						Promise.resolve({ data: serverData }),
				}),
			async () => {
				installExtractErrorMessageMock();
				vi.mocked(guardAsAddPlaylistRequest).mockReturnValue(request);
				vi.mocked(guardAsPlaylistLibraryEntry).mockReturnValue(serverData);
				vi.mocked(acceptPendingSharesForItem).mockReturnValue(Effect.succeed(undefined));

				const addSpy = vi.fn();
				const setError = vi.fn();
				const isInSpy = vi.fn((): boolean => false);
				const get = makeGet(setError, isInSpy, addSpy);

				await Effect.runPromise(addPlaylistToLibrary(request, get));

				expect(addSpy).toHaveBeenCalledWith(serverData);
				expect(globalThis.fetch).toHaveBeenCalledWith(
					"/api/playlist-library/add",
					expect.any(Object),
				);
				expect(vi.mocked(acceptPendingSharesForItem)).toHaveBeenCalledWith("playlist", "p1", get);
				expect(vi.mocked(clientWarn)).not.toHaveBeenCalled();
			},
		);
	});

	it("early-exits when playlist already in library", async () => {
		const request: AddPlaylistToLibraryRequest = {
			playlist_id: "p2",
		};

		await withFetchMock(
			() => vi.fn().mockRejectedValue(new Error("should not be called")),
			async () => {
				installExtractErrorMessageMock();
				vi.mocked(guardAsAddPlaylistRequest).mockReturnValue(request);
				const addSpy = vi.fn();
				const setError = vi.fn();
				const isInSpy = vi.fn((): boolean => true);
				const get = makeGet(setError, isInSpy, addSpy);

				await Effect.runPromise(addPlaylistToLibrary(request, get));

				expect(isInSpy).toHaveBeenCalledWith("p2");
				expect(addSpy).not.toHaveBeenCalled();
				expect(vi.mocked(clientWarn)).toHaveBeenCalledWith(
					"[addPlaylistToLibrary] Playlist already in library:",
					"p2",
				);
			},
		);
	});

	it("sets playlist library error when server responds non-ok", async () => {
		const request: AddPlaylistToLibraryRequest = {
			playlist_id: "p3",
		};

		await withFetchMock(
			() =>
				vi.fn().mockResolvedValue({
					ok: false,
					status: 500,
					statusText: "Server Error",
					json: (): Promise<{ error: string }> => Promise.resolve({ error: "bad" }),
				}),
			async () => {
				installExtractErrorMessageMock();
				vi.mocked(guardAsAddPlaylistRequest).mockReturnValue(request);
				const addSpy = vi.fn();
				const setError = vi.fn();
				const isInSpy = vi.fn((): boolean => false);
				const get = makeGet(setError, isInSpy, addSpy);

				await expect(Effect.runPromise(addPlaylistToLibrary(request, get))).rejects.toBeDefined();

				expect(setError).toHaveBeenCalledWith(
					expect.stringMatching(/Server returned|Unknown error|bad/),
				);
				expect(addSpy).not.toHaveBeenCalled();
			},
		);
	});
});
