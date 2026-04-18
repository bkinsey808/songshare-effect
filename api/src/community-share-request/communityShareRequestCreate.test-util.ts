/**
 * Test helper for communityShareRequestCreate - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Mock Supabase client for testing community share request creation.
 * @param communityUserStatus - Optional status to return for existing community user.
 * @param communityUserError - When true, the community user select will return an error.
 * @param insertError - When true, inserting the share request will return an error.
 * @returns A mock Supabase client.
 */
export default function makeCommunityShareRequestCreateClient(
	opts: {
		communityUserStatus?: "joined" | "invited";
		communityUserError?: boolean;
		insertError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const status = opts.communityUserStatus ?? "joined";
	const communityUserError = opts.communityUserError ?? false;
	const insertError = opts.insertError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({
								single: (): Promise<{
									data: { status: string } | null;
									error: ReturnType<typeof makeNull> | { message: string };
								}> =>
									communityUserError
										? promiseResolved({
												data: makeNull(),
												error: { message: "PGRST116" },
											})
										: promiseResolved({ data: { status }, error: makeNull() }),
							}),
						}),
					}),
				};
			}
			if (table === "community_share_request") {
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
