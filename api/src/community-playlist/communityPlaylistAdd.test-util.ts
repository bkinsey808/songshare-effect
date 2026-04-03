/**
 * Test helper for communityPlaylistAdd - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communityPlaylistAdd - builds a Supabase client stub.
 *
 * @param requesterRole - Role of the user requesting the add
 * @param requesterRoleError - Whether to simulate an error fetching the requester role
 * @param insertError - Whether to simulate an error during the add operation
 * @returns A mocked Supabase client
 */
export default function makeCommunityPlaylistAddClient(
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
			if (table === "community_playlist") {
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
