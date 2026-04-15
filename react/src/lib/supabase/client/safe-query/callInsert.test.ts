import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import forceCast from "@/react/lib/test-utils/forceCast";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import callInsert from "./callInsert";

/**
 * Build a minimal supabase-like client used in callInsert tests.
 *
 * @param opts - Options to control presence of `.from` and `.insert` functions
 * @returns A `SupabaseClientLike` stub
 */
function makeClient(opts: { hasFrom?: boolean; hasInsert?: boolean }): SupabaseClientLike {
	const hasFrom = opts.hasFrom !== false;
	const hasInsert = opts.hasInsert !== false;

	const emptyResponse = {
		data: JSON.parse("null") as unknown,
		error: JSON.parse("null") as unknown,
	};
	const result = promiseResolved(emptyResponse);

	const insertChain = {
		select: vi.fn(() => result),
		single: vi.fn(() => result),
	};
	Object.assign(result as object, insertChain);

	const fromFn = hasFrom
		? vi.fn(() => ({
				insert: hasInsert ? vi.fn(() => result) : undefined,
			}))
		: undefined;

	return forceCast<SupabaseClientLike>({
		from: fromFn,
		channel: vi.fn(),
		removeChannel: vi.fn(),
		auth: { getUser: vi.fn() },
	});
}

describe("callInsert", () => {
	it("throws when client does not have from function", async () => {
		const client = makeClient({ hasFrom: false });

		await expect(callInsert(client, "song", { row: { name: "test" } })).rejects.toThrow(
			"Supabase client missing from(...)",
		);
	});

	it("throws when from().insert is not a function", async () => {
		const client = makeClient({});
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		vi.mocked(clientWithMockFrom.from).mockReturnValue({ insert: undefined });

		await expect(callInsert(client, "song", { row: { name: "test" } })).rejects.toThrow(
			"Supabase from(...).insert missing",
		);
	});

	it("calls insert with row and returns data when successful", async () => {
		const row = { name: "New Song" };
		const inserted = { id: "1", ...row };
		const client = makeClient({});
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		const insertFn = vi.fn(() =>
			promiseResolved({ data: inserted, error: JSON.parse("null") as unknown }),
		);
		const tableObj = { insert: insertFn };
		const tableObjTyped = forceCast(tableObj);
		vi.mocked(clientWithMockFrom.from).mockReturnValue(tableObjTyped);

		const result = await callInsert(client, "song", { row });

		expect(insertFn).toHaveBeenCalledWith(row);
		expect(result.data).toStrictEqual(inserted);
	});

	it("calls select when selectCols provided", async () => {
		const client = makeClient({});
		const selectFn = vi.fn(() =>
			promiseResolved({ data: {}, error: JSON.parse("null") as unknown }),
		);
		const insertChain = { select: selectFn, single: vi.fn() };
		const insertResult = promiseResolved({ data: {}, error: JSON.parse("null") as unknown });
		Object.assign(insertResult as object, insertChain);
		const tableObj = { insert: vi.fn(() => insertResult) };
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		const tableObjTyped = forceCast(tableObj);
		vi.mocked(clientWithMockFrom.from).mockReturnValue(tableObjTyped);

		await callInsert(client, "song", { row: { val: 1 }, selectCols: "id, name" });

		expect(selectFn).toHaveBeenCalledWith("id, name");
	});

	it("calls single when single option is true", async () => {
		const client = makeClient({});
		const singleFn = vi.fn(() =>
			promiseResolved({ data: { id: "1" }, error: JSON.parse("null") as unknown }),
		);
		const insertChain = {
			select: vi.fn(() => {
				const chain = promiseResolved({ data: { id: "1" }, error: JSON.parse("null") as unknown });
				Object.assign(chain as object, { single: singleFn });
				return chain;
			}),
			single: singleFn,
		};
		const insertResult = promiseResolved({ data: {}, error: JSON.parse("null") as unknown });
		Object.assign(insertResult as object, insertChain);
		const tableObj = { insert: vi.fn(() => insertResult) };
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		const tableObjTyped = forceCast(tableObj);
		vi.mocked(clientWithMockFrom.from).mockReturnValue(tableObjTyped);

		await callInsert(client, "song", { row: { val: 1 }, selectCols: "*", single: true });

		expect(singleFn).toHaveBeenCalledWith();
	});
});
