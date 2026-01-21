import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";

import enrichWithOwnerUsername from "./enrichWithOwnerUsername";
import fetchUsername from "./fetchUsername";

vi.mock("./fetchUsername");

const mockedFetch = vi.mocked(fetchUsername);

// Helper implementations for supabase-like query chain used by tests
function singleFn(): Promise<unknown> {
	return Promise.resolve({ data: undefined, error: undefined });
}

function eqFn(_col: string, _val: string): { single: () => Promise<unknown> } {
	return { single: singleFn };
}

function selectFn(_column: string): {
	eq: (col: string, val: string) => { single: () => Promise<unknown> };
} {
	return { eq: eqFn };
}

function fromFn(_tableName: string): {
	select: (column: string) => {
		eq: (col: string, val: string) => { single: () => Promise<unknown> };
	};
} {
	return { select: selectFn };
}

function createClient(): SupabaseClientLike {
	// Minimal supabase client stub implementing the query chain used by code under test.
	// Returning a small, well-typed object avoids unsafe casts.
	type ChannelLike = {
		on: (event: string, opts: unknown, handler: (payload: unknown) => void) => ChannelLike;
		subscribe: (cb: (status: string, err?: unknown) => void) => unknown;
	};

	const channelLike: ChannelLike = {
		on: (_event: string, _opts: unknown, _handler: (payload: unknown) => void): ChannelLike =>
			channelLike,
		subscribe: (_cb: (status: string, err?: unknown) => void): unknown => ({}),
	};

	return {
		from: fromFn,
		// Minimal realtime stubs to satisfy SupabaseClientLike in tests that only exercise `from`.
		channel: (_name: string) => channelLike,
		removeChannel: (_channel: unknown): void => {
			// noop
		},
	};
}

describe("enrichWithOwnerUsername", () => {
	it("returns the original record when userId field is missing or not a string", async () => {
		vi.clearAllMocks();
		const client = createClient();

		const record1 = { name: "no-owner" };
		const result1 = await enrichWithOwnerUsername(client, record1);
		expect(result1).toBe(record1);

		const record2: Record<string, unknown> = { song_owner_id: {} };
		const result2 = await enrichWithOwnerUsername(client, record2);
		expect(result2).toBe(record2);

		expect(mockedFetch).not.toHaveBeenCalled();
	});

	it("returns the original record when fetchUsername returns undefined", async () => {
		vi.clearAllMocks();
		const client = createClient();
		mockedFetch.mockResolvedValue(undefined);

		const record = { song_owner_id: "user-1", title: "Song" };
		const result = await enrichWithOwnerUsername(client, record);

		expect(result).toStrictEqual(record);
		expect(mockedFetch).toHaveBeenCalledWith({ client, userId: "user-1" });
	});

	it("adds owner_username when fetchUsername returns a username", async () => {
		vi.clearAllMocks();
		const client = createClient();
		mockedFetch.mockResolvedValue("alice");

		const record = { song_owner_id: "user-2", title: "Another" };
		const result = await enrichWithOwnerUsername(client, record);

		expect(result).toStrictEqual({ ...record, owner_username: "alice" });
		expect(mockedFetch).toHaveBeenCalledWith({ client, userId: "user-2" });
	});

	it("respects a custom userIdField", async () => {
		vi.clearAllMocks();
		const client = createClient();
		mockedFetch.mockResolvedValue("bob");

		const record = { owner_id: "user-3", title: "Custom Field" };
		const result = await enrichWithOwnerUsername(client, record, "owner_id");

		expect(result).toStrictEqual({ ...record, owner_username: "bob" });
		expect(mockedFetch).toHaveBeenCalledWith({ client, userId: "user-3" });
	});
});
