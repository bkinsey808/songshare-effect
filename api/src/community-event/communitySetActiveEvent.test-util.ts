/**
 * Test helper for communitySetActiveEvent - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communitySetActiveEvent - builds a Supabase client stub.
 *
 * @param requesterRole - role of the user (owner, admin, member)
 * @param requesterRoleError - whether to simulate a fetch error for the role
 * @param updateError - whether to simulate an update error
 * @returns A mocked Supabase client
 */
export default function makeCommunitySetActiveEventClient({
	requesterRole = "owner",
	requesterRoleError = false,
	updateError = false,
}: {
	requesterRole?: "owner" | "community_admin" | "member";
	requesterRoleError?: boolean;
	updateError?: boolean;
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
			if (table === "community_public") {
				return {
					update: (): object => ({
						eq: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
							updateError
								? promiseResolved({ error: { message: "update failed" } })
								: promiseResolved({ error: makeNull() }),
					}),
				};
			}
			return {};
		},
	});
}
