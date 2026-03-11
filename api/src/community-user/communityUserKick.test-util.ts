/**
 * Test helper for communityUserKick - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

export default function makeCommunityUserKickClient(opts: {
	requesterRole?: "owner" | "community_admin" | "member";
	requesterRoleError?: boolean;
	updateError?: boolean;
} = {}): ReturnType<typeof createClient> {
	const role = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const updateError = opts.updateError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({
								single: (): Promise<{
									data: { role: string } | ReturnType<typeof makeNull>;
									error: ReturnType<typeof makeNull> | { message: string };
								}> =>
									requesterRoleError
										? promiseResolved({ data: makeNull(), error: { message: "PGRST116" } })
										: promiseResolved({ data: { role }, error: makeNull() }),
							}),
						}),
					}),
					update: (): object => ({
						eq: (): object => ({
							eq: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
								updateError
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
