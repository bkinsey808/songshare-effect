/**
 * Test helper for communityEventRemove - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

export default function makeCommunityEventRemoveClient(opts: {
	requesterRole?: "owner" | "community_admin" | "member";
	requesterRoleError?: boolean;
	deleteError?: boolean;
	clearActiveError?: boolean;
} = {}): ReturnType<typeof createClient> {
	const role = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const deleteError = opts.deleteError ?? false;
	const clearActiveError = opts.clearActiveError ?? false;

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
