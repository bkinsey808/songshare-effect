/**
 * Test helper for communityPlaylistRemove - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communityPlaylistRemove - builds a Supabase client stub.
 *
 * @param requesterRole - Role of the user requesting the remove
 * @param requesterRoleError - Whether to simulate an error fetching the requester role
 * @param deleteError - Whether to simulate an error during the remove operation
 * @returns A mocked Supabase client
 */
export default function makeCommunityPlaylistRemoveClient(
	opts: {
		requesterRole?: "owner" | "community_admin" | "member";
		requesterRoleError?: boolean;
		deleteError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const role = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const deleteError = opts.deleteError ?? false;

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
					delete: (): object => ({
						eq: (): object => ({
							eq: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
								deleteError
									? promiseResolved({ error: { message: "delete failed" } })
									: promiseResolved({ error: makeNull() }),
						}),
					}),
				};
			}
			return {};
		},
	});
}
