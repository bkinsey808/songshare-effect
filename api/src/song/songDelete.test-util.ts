/**
 * Test helper for songDelete - patches a fake Supabase client for delete().eq().eq() chain.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";

type DeleteResponse = { data?: unknown; error?: unknown };
type DeleteHandler = (...args: unknown[]) => Promise<unknown>;

/**
 * Patches a fake Supabase client so calls to `.from('song').delete().eq(...).eq(...)`
 * return the provided response or invoke the handler when configured.
 */
export default function patchSongDelete(
	client: unknown,
	resp: DeleteResponse | DeleteHandler,
): ReturnType<typeof createClient> {
	const fakeClient = forceCast<Record<string, unknown>>(client);
	const fromFn = fakeClient.from;
	const orig =
		typeof fromFn === "function"
			? forceCast<(table: string) => unknown>(fromFn.bind(fakeClient))
			: undefined;

	Reflect.set(fakeClient, "from", (table: string): unknown => {
		if (table === "song") {
			return {
				delete: (): unknown => ({
					eq: (_field: string, _val: string): unknown => ({
						eq: (_field2: string, _val2: string): unknown => {
							if (typeof resp === "function") {
								return resp(_field, _val, _field2, _val2);
							}
							return Promise.resolve(resp);
						},
					}),
				}),
			};
		}
		if (orig !== undefined) {
			return orig(table);
		}
		return undefined;
	});

	return forceCast<ReturnType<typeof createClient>>(fakeClient);
}
