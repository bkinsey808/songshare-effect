import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import forceCast from "@/react/lib/test-utils/forceCast";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import callSelect from "./callSelect";

/**
 * Create a minimal supabase-like client stub for callSelect tests.
 *
 * @param data - Rows to return from the query.
 * @param error - Error to return from the query, if any.
 * @param hasFrom - When false, the client will not include a `.from` function.
 * @param hasSelect - When false, the `.from(...).select` function will be absent.
 * @returns A `SupabaseClientLike` suitable for tests.
 */
function makeClient(opts: {
	data?: unknown[];
	error?: unknown;
	hasFrom?: boolean;
	hasSelect?: boolean;
}): SupabaseClientLike {
	const data = opts.data ?? [];
	const err = opts.error ?? (JSON.parse("null") as unknown);
	const hasFrom = opts.hasFrom !== false;
	const hasSelect = opts.hasSelect !== false;

	const result = promiseResolved({ data, error: err });
	// Attach chain methods to the Promise so we have a thenable without adding `then` to a plain object
	type ChainType = Promise<{ data: unknown; error: unknown }> & {
		in: (col: string, vals: readonly unknown[]) => Promise<{ data: unknown; error: unknown }>;
		eq: (col: string, val: unknown) => Promise<{ data: unknown; error: unknown }>;
		order: (col: string) => Promise<{ data: unknown; error: unknown }>;
		single: () => Promise<{ data: unknown; error: unknown }>;
	};
	const chain = forceCast<ChainType>(result);
	chain["in"] = (): Promise<{ data: unknown; error: unknown }> => result;
	chain["eq"] = (): Promise<{ data: unknown; error: unknown }> => result;
	chain["order"] = (): Promise<{ data: unknown; error: unknown }> => result;
	chain["single"] = (): Promise<{ data: unknown; error: unknown }> => result;
	vi.spyOn(chain, "in").mockImplementation(() => result);
	vi.spyOn(chain, "eq").mockImplementation(() => result);
	vi.spyOn(chain, "order").mockImplementation(() => result);
	vi.spyOn(chain, "single").mockImplementation(() => result);

	const fromFn = hasFrom
		? vi.fn(() => ({
				select: hasSelect ? vi.fn(() => chain) : undefined,
			}))
		: undefined;

	return forceCast<SupabaseClientLike>({
		from: fromFn,
		channel: vi.fn(),
		removeChannel: vi.fn(),
		auth: { getUser: vi.fn() },
	});
}

describe("callSelect", () => {
	it("throws when client does not have from function", async () => {
		const client = makeClient({ hasFrom: false });

		await expect(callSelect(client, "song_public")).rejects.toThrow(
			"Supabase client missing from(...)",
		);
	});

	it("throws when from().select is not a function", async () => {
		const client = makeClient({});
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		vi.mocked(clientWithMockFrom.from).mockReturnValue({
			select: undefined,
		});

		await expect(callSelect(client, "song_public")).rejects.toThrow(
			"Supabase from(...).select missing",
		);
	});

	it("returns data when query succeeds", async () => {
		const rows = [{ id: "1", name: "test" }];
		const client = makeClient({ data: rows });

		const result = await callSelect(client, "song_public");

		expect(result).toMatchObject({ data: rows });
		expect(result.error).toBe(JSON.parse("null") as unknown);
	});

	it("calls select with cols when opts.cols provided", async () => {
		const client = makeClient({});
		const emptyResponse = { data: [] as unknown[], error: JSON.parse("null") as unknown };
		const tableObj = {
			select: vi.fn(() => promiseResolved(emptyResponse)),
		};
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		const tableObjTyped = forceCast(tableObj);
		vi.mocked(clientWithMockFrom.from).mockReturnValue(tableObjTyped);

		await callSelect(client, "song_public", { cols: "id, name" });

		expect(tableObj.select).toHaveBeenCalledWith("id, name");
	});

	it("applies in filter when opts.in provided", async () => {
		const emptyResponse = promiseResolved({
			data: [] as unknown[],
			error: JSON.parse("null") as unknown,
		});
		const chain = {
			in: vi.fn(() => emptyResponse),
		};
		const client = forceCast<SupabaseClientLike>({
			from: (): { select: () => typeof chain } => ({ select: (): typeof chain => chain }),
		});

		await callSelect(client, "song_public", {
			in: { col: "song_slug", vals: ["slug-1", "slug-2"] },
		});

		expect(chain.in).toHaveBeenCalledWith("song_slug", ["slug-1", "slug-2"]);
	});

	it("applies eq filter when opts.eq provided", async () => {
		const emptyResponse = promiseResolved({
			data: [] as unknown[],
			error: JSON.parse("null") as unknown,
		});
		const chain = {
			eq: vi.fn(() => emptyResponse),
		};
		const client = forceCast<SupabaseClientLike>({
			from: (): { select: () => typeof chain } => ({ select: (): typeof chain => chain }),
		});

		await callSelect(client, "playlist_public", {
			eq: { col: "playlist_id", val: "pid-1" },
		});

		expect(chain.eq).toHaveBeenCalledWith("playlist_id", "pid-1");
	});

	it("applies order when opts.order provided", async () => {
		const emptyResponse = promiseResolved({
			data: [] as unknown[],
			error: JSON.parse("null") as unknown,
		});
		const chain = {
			order: vi.fn(() => emptyResponse),
		};
		const client = forceCast<SupabaseClientLike>({
			from: (): { select: () => typeof chain } => ({ select: (): typeof chain => chain }),
		});

		await callSelect(client, "song_public", { order: "created_at" });

		expect(chain.order).toHaveBeenCalledWith("created_at");
	});

	it("applies single when opts.single is true", async () => {
		const singleResponse = promiseResolved({
			data: { id: "1" },
			error: JSON.parse("null") as unknown,
		});
		const chain = {
			single: vi.fn(() => singleResponse),
		};
		const client = forceCast<SupabaseClientLike>({
			from: (): { select: () => typeof chain } => ({ select: (): typeof chain => chain }),
		});

		await callSelect(client, "playlist_public", { single: true });

		expect(chain.single).toHaveBeenCalledWith();
	});
});
