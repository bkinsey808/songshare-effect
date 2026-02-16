import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.mock";

import resolveUsername from "./resolveUsername";

const SAMPLE_USER = { user_id: "00000000-0000-0000-0000-000000000001", name: "Existing" } as const;

describe("resolveUsername", () => {
	it("returns username when user_public row exists", async () => {
		const supabase = makeSupabaseClient({
			userPublicMaybe: { user_id: "00000000-0000-0000-0000-000000000001", username: "un" },
		});

		const res = await Effect.runPromise(resolveUsername(supabase, SAMPLE_USER));
		expect(res).toBe("un");
	});

	it("returns undefined when no user_public row", async () => {
		const supabase = makeSupabaseClient();
		const res = await Effect.runPromise(resolveUsername(supabase, SAMPLE_USER));
		expect(res).toBeUndefined();
	});

	it("fails with DatabaseError when validation of user_public fails", async () => {
		// username numeric will fail schema validation
		const supabase = makeSupabaseClient({
			userPublicMaybe: { user_id: "00000000-0000-0000-0000-000000000001", username: 123 },
		});
		await expect(Effect.runPromise(resolveUsername(supabase, SAMPLE_USER))).rejects.toThrow(
			/Unknown error|validation|Expected string|NonEmptyString/i,
		);
	});

	it("fails with DatabaseError when supabase.from returns error (use makeSupabaseClient)", async () => {
		const supabase = makeSupabaseClient();

		vi.spyOn(supabase, "from").mockImplementation(
			(_table: string): ReturnType<typeof makeSupabaseClient>["from"] => {
				const table = {
					select: (
						_cols: string,
					): {
						eq: (
							_field: string,
							_val: string,
						) => { maybeSingle: () => Promise<{ data: unknown; error: unknown } | undefined> };
					} => ({
						eq: (
							_field: string,
							_val: string,
						): { maybeSingle: () => Promise<{ data: unknown; error: unknown } | undefined> } => ({
							maybeSingle: async (): Promise<{ data: unknown; error: unknown } | undefined> => {
								await Promise.resolve();
								return { data: undefined, error: { message: "db fail" } };
							},
						}),
					}),
				};
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only cast */
				return table as unknown as ReturnType<typeof makeSupabaseClient>["from"];
			},
		);

		await expect(Effect.runPromise(resolveUsername(supabase, SAMPLE_USER))).rejects.toThrow(
			/db fail/,
		);
	});
});
