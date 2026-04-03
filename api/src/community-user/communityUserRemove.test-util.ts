/**
 * Test helper for communityUserRemove - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communityUserRemove - builds a Supabase client stub.
 *
 * @param updateError - Whether to simulate a database error during update
 * @returns A mocked Supabase client
 */
export default function makeCommunityUserRemoveClient(
	opts: {
		updateError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const updateError = opts.updateError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
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
