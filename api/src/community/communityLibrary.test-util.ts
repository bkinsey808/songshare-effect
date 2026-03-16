/**
 * Test helper for communityLibrary - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

type CommunityEntry = {
	community_id: string;
	owner_id: string;
	name: string;
	slug: string;
	description: string | null;
	is_public: boolean;
	public_notes: string | null;
	created_at: string;
	updated_at: string;
};

export default function makeCommunityLibraryClient(
	opts: {
		communityUserData?: { community_id: string }[];
		communityUserError?: boolean;
		communityPublicData?: CommunityEntry[];
		communityPublicError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const membershipData = opts.communityUserData ?? [];
	const communityUserError = opts.communityUserError ?? false;
	const communityPublicData = opts.communityPublicData ?? [];
	const communityPublicError = opts.communityPublicError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (
								_col: string,
								_val: string,
							): Promise<{
								data: { community_id: string }[] | null;
								error: ReturnType<typeof makeNull> | { message: string };
							}> =>
								communityUserError
									? promiseResolved({ data: makeNull(), error: { message: "db error" } })
									: promiseResolved({ data: membershipData, error: makeNull() }),
						}),
					}),
				};
			}
			if (table === "community_public") {
				return {
					select: (): object => ({
						in: (
							_col: string,
							_vals: string[],
						): Promise<{
							data: CommunityEntry[] | null;
							error: ReturnType<typeof makeNull> | { message: string };
						}> =>
							communityPublicError
								? promiseResolved({ data: makeNull(), error: { message: "db error" } })
								: promiseResolved({ data: communityPublicData, error: makeNull() }),
					}),
				};
			}
			return {};
		},
	});
}
