import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import type {
	PostgrestResponse,
	RealtimeChannelLike,
} from "@/react/lib/supabase/client/SupabaseClientLike";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeSongLibraryEntry from "@/react/song-library/test-utils/makeSongLibraryEntry.mock";

import makeSongLibrarySlice from "../makeSongLibrarySlice.mock";
import handleSongLibrarySubscribeEvent from "./handleSongLibrarySubscribeEvent";

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

// Use the reusable test slice factory which already exposes spies for add/remove
// access the spies via `slice.addSongLibraryEntry` and `slice.removeSongLibraryEntry`
// by creating a getter `get` using the factory.

describe("handleSongLibrarySubscribeEvent", () => {
	it("ignores payloads that do not match the realtime shape", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();
		const mockEnrichWithOwnerUsername = await spyImport(
			"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
		);

		await Effect.runPromise(handleSongLibrarySubscribeEvent({}, supabaseClient, get));

		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(mockEnrichWithOwnerUsername).not.toHaveBeenCalled();
	});

	it.each(["INSERT", "UPDATE"] as const)("adds a new entry for %s events", async (eventType) => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();
		const newEntry = makeSongLibraryEntry({ song_id: "song-123", song_owner_id: "owner-456" });
		const enrichedEntry = {
			song_id: newEntry.song_id,
			song_owner_id: newEntry.song_owner_id,
			owner_username: "test-user",
		};
		const mockEnrichWithOwnerUsername = await spyImport(
			"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
		);
		const payload = {
			eventType,
			new: { song_id: newEntry.song_id, song_owner_id: newEntry.song_owner_id },
		};
		mockEnrichWithOwnerUsername.mockResolvedValue(enrichedEntry);
		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get));
		expect(mockEnrichWithOwnerUsername).toHaveBeenCalledWith(
			supabaseClient,
			expect.objectContaining({ song_id: newEntry.song_id, song_owner_id: newEntry.song_owner_id }),
			"song_owner_id",
		);
		expect(slice.addSongLibraryEntry).toHaveBeenCalledWith(enrichedEntry);
		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips inserts when payload.new is missing", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();

		const mockEnrichWithOwnerUsername = await spyImport(
			"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
		);

		const payload = { eventType: "INSERT" as const };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get));

		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(mockEnrichWithOwnerUsername).not.toHaveBeenCalled();
	});

	it("skips malformed new entries that fail validation", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();
		const mockEnrichWithOwnerUsername = await spyImport(
			"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
		);
		const malformedEntry = { song_id: "song-123", song_owner_id: 42 };

		const payload = { eventType: "UPDATE" as const, new: malformedEntry };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get));

		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(mockEnrichWithOwnerUsername).not.toHaveBeenCalled();
	});

	it("removes an entry when DELETE includes a song_id", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();
		const songId = "song-789";

		const payload = { eventType: "DELETE", old: { song_id: songId } };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get));

		expect(slice.removeSongLibraryEntry).toHaveBeenCalledWith(songId);
		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE payload is missing song_id", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();

		const payload = { eventType: "DELETE", old: {} };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get));

		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("skips removal when DELETE song_id is not a string", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();

		const payload = { eventType: "DELETE" as const, old: { song_id: 1234 } };

		await Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get));

		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
	});

	it("fails the effect when enrichment rejects", async () => {
		vi.resetAllMocks();
		const get = makeSongLibrarySlice();
		const slice = get();
		const newEntry = makeSongLibraryEntry({ song_id: "song-999", song_owner_id: "owner-000" });
		const mockEnrichWithOwnerUsername = await spyImport(
			"@/react/lib/supabase/enrichment/enrichWithOwnerUsername",
		);
		mockEnrichWithOwnerUsername.mockRejectedValue(new Error("fetch failure"));

		const payload = {
			eventType: "INSERT" as const,
			new: { song_id: newEntry.song_id, song_owner_id: newEntry.song_owner_id },
		};

		await expect(() =>
			Effect.runPromise(handleSongLibrarySubscribeEvent(payload, supabaseClient, get)),
		).rejects.toThrow("fetch failure");

		expect(slice.addSongLibraryEntry).not.toHaveBeenCalled();
		expect(slice.removeSongLibraryEntry).not.toHaveBeenCalled();
	});
});
