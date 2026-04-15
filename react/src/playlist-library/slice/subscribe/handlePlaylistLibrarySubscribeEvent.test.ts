import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { PlaylistLibrarySlice } from "../PlaylistLibrarySlice.type";
import handlePlaylistLibrarySubscribeEvent from "./handlePlaylistLibrarySubscribeEvent";

const PLAYLIST_ID = "playlist-1";
const VALID_INSERT = {
	user_id: "u1",
	playlist_id: PLAYLIST_ID,
};
const ENRICHED_ENTRY = { ...VALID_INSERT, owner_username: "alice" };

vi.mock(
	"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
	(): { default: ReturnType<typeof vi.fn> } => ({
		default: vi.fn().mockResolvedValue({
			user_id: "u1",
			playlist_id: "playlist-1",
			owner_username: "alice",
		}),
	}),
);

describe("handlePlaylistLibrarySubscribeEvent", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	it("does nothing when payload is not a realtime payload", async () => {
		const addPlaylistLibraryEntry = vi.fn();
		const removePlaylistLibraryEntry = vi.fn();
		/**
		 * Return a mocked `PlaylistLibrarySlice` for the test.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				addPlaylistLibraryEntry,
				removePlaylistLibraryEntry,
			});
		}

		await Effect.runPromise(
			handlePlaylistLibrarySubscribeEvent({ invalid: "payload" }, fakeClient, get),
		);

		expect(addPlaylistLibraryEntry).not.toHaveBeenCalled();
		expect(removePlaylistLibraryEntry).not.toHaveBeenCalled();
	});

	it("adds enriched entry on INSERT", async () => {
		const addPlaylistLibraryEntry = vi.fn();
		/**
		 * Return a mocked `PlaylistLibrarySlice` for the INSERT test.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				addPlaylistLibraryEntry,
				removePlaylistLibraryEntry: vi.fn(),
			});
		}

		await Effect.runPromise(
			handlePlaylistLibrarySubscribeEvent(
				{ eventType: "INSERT", new: VALID_INSERT, old: undefined },
				fakeClient,
				get,
			),
		);

		expect(addPlaylistLibraryEntry).toHaveBeenCalledWith(ENRICHED_ENTRY);
	});

	it("removes entry on DELETE when playlist_id in old", async () => {
		const removePlaylistLibraryEntry = vi.fn();
		/**
		 * Return a mocked `PlaylistLibrarySlice` for the DELETE test.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				addPlaylistLibraryEntry: vi.fn(),
				removePlaylistLibraryEntry,
			});
		}

		await Effect.runPromise(
			handlePlaylistLibrarySubscribeEvent(
				{ eventType: "DELETE", new: undefined, old: { playlist_id: PLAYLIST_ID } },
				fakeClient,
				get,
			),
		);

		expect(removePlaylistLibraryEntry).toHaveBeenCalledWith(PLAYLIST_ID);
	});

	it("does not remove when old has no playlist_id", async () => {
		const removePlaylistLibraryEntry = vi.fn();
		/**
		 * Return a mocked `PlaylistLibrarySlice` for the DELETE missing-id test.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				addPlaylistLibraryEntry: vi.fn(),
				removePlaylistLibraryEntry,
			});
		}

		await Effect.runPromise(
			handlePlaylistLibrarySubscribeEvent(
				{ eventType: "DELETE", new: undefined, old: {} },
				fakeClient,
				get,
			),
		);

		expect(removePlaylistLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips INSERT when new entry is malformed", async () => {
		const addPlaylistLibraryEntry = vi.fn();
		/**
		 * Return a mocked `PlaylistLibrarySlice` for the malformed INSERT test.
		 *
		 * @returns Mocked `PlaylistLibrarySlice`
		 */
		function get(): PlaylistLibrarySlice {
			return forceCast({
				addPlaylistLibraryEntry,
				removePlaylistLibraryEntry: vi.fn(),
			});
		}

		await Effect.runPromise(
			handlePlaylistLibrarySubscribeEvent(
				{ eventType: "INSERT", new: { invalid: "shape" }, old: undefined },
				fakeClient,
				get,
			),
		);

		expect(addPlaylistLibraryEntry).not.toHaveBeenCalled();
	});
});
