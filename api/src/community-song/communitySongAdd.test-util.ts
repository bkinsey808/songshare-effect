import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communitySongAdd - builds a Supabase client stub.
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
