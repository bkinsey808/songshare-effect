import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import acceptPendingSharesForItem from "@/react/share/effects/acceptPendingSharesForItem";
import forceCast from "@/react/lib/test-utils/forceCast";
import type {
	AddPlaylistToLibraryRequest,
	PlaylistLibraryEntry,
} from "@/react/playlist-library/slice/playlist-library-types";
import type { PlaylistLibrarySlice } from "@/react/playlist-library/slice/PlaylistLibrarySlice.type";

import guardAsAddPlaylistRequest from "../guards/guardAsAddPlaylistRequest";
import guardAsPlaylistLibraryEntry from "../guards/guardAsPlaylistLibraryEntry";
import addPlaylistToLibrary from "./addPlaylistToLibrary";

vi.mock("@/react/share/effects/acceptPendingSharesForItem");
vi.mock("@/react/lib/utils/clientLogger");
// oxlint-disable-next-line jest/no-untyped-mock-factory -- factory returns simple stub
vi.mock("@/shared/error-message/extractErrorMessage", () => ({
	default: (err: unknown, def: string): string =>
		typeof err === "string" ? err : def,
}));
// oxlint-disable-next-line jest/no-untyped-mock-factory -- factory returns path constant
vi.mock("@/shared/paths", () => ({ apiPlaylistLibraryAddPath: "/api/playlist-library/add" }));
vi.mock("../guards/guardAsAddPlaylistRequest");
vi.mock("../guards/guardAsPlaylistLibraryEntry");

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

describe("addPlaylistToLibrary", () => {
	it("posts to API and adds entry when server returns a valid playlist entry", async () => {
		const request: AddPlaylistToLibraryRequest = {
			playlist_id: "p1",
			playlist_owner_id: "u1",
		};
		const serverData: PlaylistLibraryEntry = {
			playlist_id: "p1",
			playlist_owner_id: "u1",
			user_id: "u1",
			created_at: "2025-01-01T00:00:00Z",
		};

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
				expect(vi.mocked(acceptPendingSharesForItem)).toHaveBeenCalledWith(
					"playlist",
					"p1",
					get,
				);
				expect(vi.mocked(clientWarn)).not.toHaveBeenCalled();
			},
		);
	});

	it("early-exits when playlist already in library", async () => {
		const request: AddPlaylistToLibraryRequest = {
			playlist_id: "p2",
			playlist_owner_id: "u2",
		};

		await withFetchMock(
			() => vi.fn().mockRejectedValue(new Error("should not be called")),
			async () => {
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
			playlist_owner_id: "u3",
		};

		await withFetchMock(
			() =>
				vi.fn().mockResolvedValue({
					ok: false,
					status: 500,
					statusText: "Server Error",
					json: (): Promise<{ error: string }> =>
						Promise.resolve({ error: "bad" }),
				}),
			async () => {
				vi.mocked(guardAsAddPlaylistRequest).mockReturnValue(request);
				const addSpy = vi.fn();
				const setError = vi.fn();
				const isInSpy = vi.fn((): boolean => false);
				const get = makeGet(setError, isInSpy, addSpy);

				await expect(
					Effect.runPromise(addPlaylistToLibrary(request, get)),
				).rejects.toBeDefined();

				expect(setError).toHaveBeenCalledWith(
					expect.stringMatching(/Server returned|Unknown error|bad/),
				);
				expect(addSpy).not.toHaveBeenCalled();
			},
		);
	});
});
