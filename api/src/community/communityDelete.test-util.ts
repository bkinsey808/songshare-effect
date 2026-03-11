/**
 * Test helper for communityDelete - builds a Supabase client stub.
 * Returns role from community_user select; delete succeeds.
 */
import type { createClient } from "@supabase/supabase-js";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

export default function makeCommunityDeleteClient(
	communityUserRole: "owner" | "member",
): ReturnType<typeof createClient> {
	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({
								single: (): Promise<{ data: { role: string }; error: ReturnType<typeof makeNull> }> =>
									promiseResolved({ data: { role: communityUserRole }, error: makeNull() }),
							}),
						}),
					}),
				};
			}
			if (table === "community") {
				return {
					delete: (): object => ({
						eq: (): Promise<{ error: ReturnType<typeof makeNull> }> =>
							promiseResolved({ error: makeNull() }),
					}),
				};
			}
			return {};
		},
	});
}
