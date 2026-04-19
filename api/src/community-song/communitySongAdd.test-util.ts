import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Mock Supabase client for testing community song additions.
 * @param requesterRole - Role to return for the requester lookup.
 * @param requesterRoleError - When true, requester lookup will return an error.
 * @param insertError - When true, inserting the community song will fail.
 * @returns A mock Supabase client.
 */
export default function makeCommunitySongAddClient(
	opts: {
		requesterRole?: "owner" | "community_admin" | "member";
		requesterRoleError?: boolean;
		insertError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const role = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const insertError = opts.insertError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({
								single: (): Promise<{
									data: { role: string } | null;
									error: ReturnType<typeof makeNull> | { message: string };
								}> =>
									requesterRoleError
										? promiseResolved({ data: makeNull(), error: { message: "PGRST116" } })
										: promiseResolved({ data: { role }, error: makeNull() }),
							}),
						}),
					}),
				};
			}
			if (table === "community_song") {
				return {
					insert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						insertError
							? promiseResolved({ error: { message: "insert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}
