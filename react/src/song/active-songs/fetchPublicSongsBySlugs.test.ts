import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import fetchPublicSongsBySlugs from "./fetchPublicSongsBySlugs";

const SONG_SLUG = "my-song";

type SupabaseQueryResult = Promise<{ data: unknown[]; error: unknown }>;

function makeSupabaseClient(opts: {
	data?: unknown[];
	error?: unknown;
}): {
	from: (table: string) => {
		select: (query: string) => {
			in: (column: string, values: readonly string[]) => SupabaseQueryResult;
		};
	};
} {
	const data = opts.data ?? [];
	const err = opts.error ?? (JSON.parse("null") as unknown);
	return {
		from: (): { select: (query: string) => { in: () => SupabaseQueryResult } } => ({
			select: (): { in: () => SupabaseQueryResult } => ({
				in: (): SupabaseQueryResult => promiseResolved({ data, error: err }),
			}),
		}),
	};
}

describe("fetchPublicSongsBySlugs", () => {
	it("returns error when supabase client is invalid", async () => {
		const result = await fetchPublicSongsBySlugs(undefined, [SONG_SLUG]);

		expect(result.data).toBeUndefined();
		expect(result.error).toBeInstanceOf(Error);
		expect(forceCast<Error>(result.error).message).toBe("Invalid Supabase client");
	});

	it("returns error when supabase client is not an object with from", async () => {
		const result = await fetchPublicSongsBySlugs({}, [SONG_SLUG]);

		expect(result.data).toBeUndefined();
		expect(result.error).toBeInstanceOf(Error);
	});

	it("returns data when query succeeds", async () => {
		const rows = [{ song_id: "s1", song_slug: SONG_SLUG }];
		const client = makeSupabaseClient({ data: rows });
		const spyError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const result = await fetchPublicSongsBySlugs(client, [SONG_SLUG]);

		expect(result.data).toStrictEqual(rows);
		expect(result.error).toBeUndefined();
		spyError.mockRestore();
	});

	it("returns error when Supabase returns error", async () => {
		const supabaseError = { message: "query failed" };
		const client = makeSupabaseClient({ error: supabaseError });
		const spyError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const result = await fetchPublicSongsBySlugs(client, [SONG_SLUG]);

		expect(result.data).toBeUndefined();
		expect(result.error).toStrictEqual(supabaseError);
		spyError.mockRestore();
	});

	it("calls supabase with correct table, select, and in params", async () => {
		const inSpy = vi
			.fn()
			.mockResolvedValue({ data: [] as unknown[], error: JSON.parse("null") as unknown });
		const selectSpy = vi.fn().mockReturnValue({ in: inSpy });
		const fromSpy = vi.fn().mockReturnValue({ select: selectSpy });
		const client = { from: fromSpy };
		const slugs = ["slug-a", "slug-b"];
		const spyError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		await fetchPublicSongsBySlugs(client, slugs);

		expect(fromSpy).toHaveBeenCalledWith("song_public");
		expect(selectSpy).toHaveBeenCalledWith("*");
		expect(inSpy).toHaveBeenCalledWith("song_slug", slugs);
		spyError.mockRestore();
	});
});
