import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import forceCast from "@/react/lib/test-utils/forceCast";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import callUpdate from "./callUpdate";

function makeClient(opts: { hasFrom?: boolean; hasUpdate?: boolean }): SupabaseClientLike {
	const hasFrom = opts.hasFrom !== false;
	const hasUpdate = opts.hasUpdate !== false;

	const emptyResponse = {
		data: JSON.parse("null") as unknown,
		error: JSON.parse("null") as unknown,
	};
	const result = promiseResolved(emptyResponse);

	Object.assign(result as object, {
		eq: vi.fn((): Promise<typeof emptyResponse> => result),
		select: vi.fn((): Promise<typeof emptyResponse> => result),
		single: vi.fn((): Promise<typeof emptyResponse> => result),
	});

	const fromFn = hasFrom
		? vi.fn(() => ({
				update: hasUpdate ? vi.fn(() => result) : undefined,
			}))
		: undefined;

	return forceCast<SupabaseClientLike>({
		from: fromFn,
		channel: vi.fn(),
		removeChannel: vi.fn(),
		auth: { getUser: vi.fn() },
	});
}

describe("callUpdate", () => {
	it("throws when client does not have from function", async () => {
		const client = makeClient({ hasFrom: false });

		await expect(callUpdate(client, "song", { data: { name: "updated" } })).rejects.toThrow(
			"Supabase client missing from(...)",
		);
	});

	it("throws when from().update is not a function", async () => {
		const client = makeClient({});
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		vi.mocked(clientWithMockFrom.from).mockReturnValue({ update: undefined });

		await expect(callUpdate(client, "song", { data: { name: "updated" } })).rejects.toThrow(
			"Supabase from(...).update missing",
		);
	});

	it("calls update with data and returns when successful", async () => {
		const data = { name: "Updated Song" };
		const client = makeClient({});

		const result = await callUpdate(client, "song", { data });

		expect(result).toBeDefined();
	});

	it("applies eq filter when opts.eq provided", async () => {
		const client = makeClient({});
		const eqFn = vi.fn(() => promiseResolved({ data: {}, error: JSON.parse("null") as unknown }));
		const updateResult = promiseResolved({ data: {}, error: JSON.parse("null") as unknown });
		Object.assign(updateResult as object, { eq: eqFn });
		const tableObj = { update: vi.fn(() => updateResult) };
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		const tableObjTyped = forceCast(tableObj);
		vi.mocked(clientWithMockFrom.from).mockReturnValue(tableObjTyped);

		await callUpdate(client, "song", {
			data: { name: "x" },
			eq: { col: "song_id", val: "sid-1" },
		});

		expect(eqFn).toHaveBeenCalledWith("song_id", "sid-1");
	});

	it("calls select when selectCols provided", async () => {
		const client = makeClient({});
		const selectFn = vi.fn(() =>
			promiseResolved({ data: {}, error: JSON.parse("null") as unknown }),
		);
		const updateResult = promiseResolved({ data: {}, error: JSON.parse("null") as unknown });
		Object.assign(updateResult as object, { eq: vi.fn(() => updateResult), select: selectFn });
		const tableObj = { update: vi.fn(() => updateResult) };
		const clientWithMockFrom = forceCast<{ from: ReturnType<typeof vi.fn> }>(client);
		const tableObjTyped = forceCast(tableObj);
		vi.mocked(clientWithMockFrom.from).mockReturnValue(tableObjTyped);

		await callUpdate(client, "song", { data: { val: 1 }, selectCols: "id, name" });

		expect(selectFn).toHaveBeenCalledWith("id, name");
	});
});
