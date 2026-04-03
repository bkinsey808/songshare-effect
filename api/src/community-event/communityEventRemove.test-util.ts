/**
 * Test helper for communityEventRemove - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communityEventRemove - builds a Supabase client stub.
 *
 * @param requesterRole - role of the user (owner, admin, member)
 * @param requesterRoleError - whether to simulate a fetch error for the role
 * @param deleteError - whether to simulate a delete error
 * @param clearActiveError - whether to simulate an update error
 * @returns A mocked Supabase client
 */
export default function makeCommunityEventRemoveClient({
	requesterRole = "owner",
	requesterRoleError = false,
	deleteError = false,
	clearActiveError = false,
}: {
	requesterRole?: "owner" | "community_admin" | "member";
	requesterRoleError?: boolean;
	deleteError?: boolean;
	clearActiveError?: boolean;
} = {}): ReturnType<typeof createClient> {
	const role = requesterRole;

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
			if (table === "community_event") {
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
			if (table === "community_public") {
				return {
					update: (): object => ({
						eq: (): object => ({
							eq: (): Promise<{
								error: ReturnType<typeof makeNull> | { message: string };
							}> =>
								clearActiveError
									? promiseResolved({ error: { message: "update failed" } })
									: promiseResolved({ error: makeNull() }),
						}),
					}),
				};
			}
			return {};
		},
	});
}
