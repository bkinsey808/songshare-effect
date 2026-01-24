import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import type {
	PostgrestResponse,
	RealtimeChannelLike,
} from "@/react/supabase/client/SupabaseClientLike";

import enrichWithOwnerUsername from "@/react/supabase/enrichment/enrichWithOwnerUsername";

import type { SongLibrarySlice } from "../song-library-slice";

import handleSongLibrarySubscribeEvent from "./handleSongLibrarySubscribeEvent";

vi.mock("@/react/supabase/enrichment/enrichWithOwnerUsername");

const mockEnrichWithOwnerUsername = vi.mocked(enrichWithOwnerUsername);

type SupabaseClientResolved = Exclude<ReturnType<typeof getSupabaseClient>, undefined>;
type SupabaseFromStub = {
	select: () => {
		order?: (column: string) => Promise<PostgrestResponse>;
		eq?: (column: string, value: string) => { single: () => Promise<unknown> };
	};
};

const realtimeChannel: RealtimeChannelLike = {
	on(event: string, opts: unknown, handler: (payload: unknown) => void): RealtimeChannelLike {
		void event;
		void opts;
		void handler;
		return realtimeChannel;
	},
	subscribe(callback: (status: string, err?: unknown) => void): unknown {
		callback("SUBSCRIBED");
		return undefined;
	},
	unsubscribe(): Promise<void> {
		return Promise.resolve();
	},
};

const supabaseClient: SupabaseClientResolved = {
	from<TableName extends string>(tableName: TableName): SupabaseFromStub {
		void tableName;
		return {
			select(): {
				order?: (column: string) => Promise<PostgrestResponse>;
				eq?: (column: string, value: string) => { single: () => Promise<unknown> };
			} {
				return {
					order: async (): Promise<PostgrestResponse> => {
						await Promise.resolve();
						return {};
					},
					eq: (): { single: () => Promise<unknown> } => ({
						single: async (): Promise<unknown> => {
							await Promise.resolve();
							return {};
						},
					}),
				};
			},
		};
	},
	channel: (): RealtimeChannelLike => realtimeChannel,
	removeChannel: (): undefined => undefined,
	auth: {
		getUser: async (): Promise<unknown> => {
			await Promise.resolve();
			return undefined;
		},
	},
};

/**
 * Creates a SongLibrary slice getter with tracked add/remove spies.
 *
 * @returns Getter function and associated spies for entry mutations
 */
function createSliceGetter(): {
	readonly getSlice: () => SongLibrarySlice;
	readonly addSongLibraryEntry: ReturnType<typeof vi.fn>;
	readonly removeSongLibraryEntry: ReturnType<typeof vi.fn>;
} {
	const addSongLibraryEntry = vi.fn();
	const removeSongLibraryEntry = vi.fn();

	const slice: SongLibrarySlice = {
		songLibraryEntries: {},
		isSongLibraryLoading: false,
		songLibraryError: undefined,
		addSongToSongLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
		removeSongFromSongLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
		getSongLibrarySongIds: (): string[] => [],
		fetchSongLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
		subscribeToSongLibrary: (): Effect.Effect<() => void, Error> =>
			Effect.sync((): (() => void) => () => {
				/* no-op cleanup */
			}),
		setSongLibraryEntries: (): void => {
			/* not used in tests */
		},
		setSongLibraryLoading: (): void => {
			/* not used in tests */
		},
		setSongLibraryError: (): void => {
			/* not used in tests */
		},
		addSongLibraryEntry,
		removeSongLibraryEntry,
		isInSongLibrary: (): boolean => false,
	};

	function getSlice(): SongLibrarySlice {
		return slice;
	}

	return { getSlice, addSongLibraryEntry, removeSongLibraryEntry };
}

describe("handleSongLibrarySubscribeEvent", () => {
	it("ignores payloads that do not match the realtime shape", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();

		await Effect.runPromise(handleSongLibrarySubscribeEvent({}, supabaseClient, getSlice));

		expect(addSongLibraryEntry).not.toHaveBeenCalled();
		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(mockEnrichWithOwnerUsername).not.toHaveBeenCalled();
	});

	it.each(["INSERT", "UPDATE"] as const)("adds a new entry for %s events", async (eventType) => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();
		const newEntry = { song_id: "song-123", song_owner_id: "owner-456" };
		const enrichedEntry = { ...newEntry, owner_username: "test-user" };
		mockEnrichWithOwnerUsername.mockResolvedValue(enrichedEntry);

		const payload = { eventType, new: newEntry };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice));

		expect(mockEnrichWithOwnerUsername).toHaveBeenCalledWith(
			supabaseClient,
			newEntry,
			"song_owner_id",
		);
		expect(addSongLibraryEntry).toHaveBeenCalledWith(enrichedEntry);
		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips inserts when payload.new is missing", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();

		const payload = { eventType: "INSERT" as const };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice));

		expect(addSongLibraryEntry).not.toHaveBeenCalled();
		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(mockEnrichWithOwnerUsername).not.toHaveBeenCalled();
	});

	it("skips malformed new entries that fail validation", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();
		const malformedEntry = { song_id: "song-123", song_owner_id: 42 };

		const payload = { eventType: "UPDATE" as const, new: malformedEntry };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice));

		expect(addSongLibraryEntry).not.toHaveBeenCalled();
		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(mockEnrichWithOwnerUsername).not.toHaveBeenCalled();
	});

	it("removes an entry when DELETE includes a song_id", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();
		const songId = "song-789";

		const payload = { eventType: "DELETE", old: { song_id: songId } };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice));

		expect(removeSongLibraryEntry).toHaveBeenCalledWith(songId);
		expect(addSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE payload is missing song_id", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();

		const payload = { eventType: "DELETE", old: {} };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice));

		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(addSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE song_id is not a string", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();

		const payload = { eventType: "DELETE" as const, old: { song_id: 1234 } };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice));

		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(addSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("fails the effect when enrichment rejects", async () => {
		vi.resetAllMocks();
		const { getSlice, addSongLibraryEntry, removeSongLibraryEntry } = createSliceGetter();
		const newEntry = { song_id: "song-999", song_owner_id: "owner-000" };
		mockEnrichWithOwnerUsername.mockRejectedValue(new Error("fetch failure"));

		const payload = { eventType: "INSERT" as const, new: newEntry };

		await expect(() =>
			Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, getSlice)),
		).rejects.toThrow("fetch failure");

		expect(addSongLibraryEntry).not.toHaveBeenCalled();
		expect(removeSongLibraryEntry).not.toHaveBeenCalled();
	});
});
