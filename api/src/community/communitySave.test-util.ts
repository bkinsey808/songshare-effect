/**
 * Test helper for communitySave - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

type CommunityPublicRow = {
	community_id: string;
	owner_id: string;
	name: string;
	slug: string;
	description: string;
	is_public: boolean;
	public_notes: string;
};

export default function makeCommunitySaveClient(
	opts: {
		userRole?: "owner" | "community_admin" | "member";
		userRoleError?: boolean;
		privateUpdateError?: boolean;
		publicInsertError?: boolean;
		publicUpdateError?: boolean;
		communityUserInsertError?: boolean;
		publicRow?: CommunityPublicRow;
	} = {},
): ReturnType<typeof createClient> {
	const role = opts.userRole ?? "owner";
	const userRoleError = opts.userRoleError ?? false;
	const privateUpdateError = opts.privateUpdateError ?? false;
	const publicInsertError = opts.publicInsertError ?? false;
	const publicUpdateError = opts.publicUpdateError ?? false;
	const communityUserInsertError = opts.communityUserInsertError ?? false;
	const publicRow: CommunityPublicRow = opts.publicRow ?? {
		community_id: "comm-123",
		owner_id: "user-1",
		name: "Test",
		slug: "test",
		description: "",
		is_public: false,
		public_notes: "",
	};

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
									userRoleError
										? promiseResolved({ data: makeNull(), error: { message: "PGRST116" } })
										: promiseResolved({ data: { role }, error: makeNull() }),
							}),
						}),
					}),
					insert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						communityUserInsertError
							? promiseResolved({ error: { message: "insert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			if (table === "community") {
				return {
					select: (): object => ({
						eq: (): object => ({
							single: (): Promise<{
								data: { community_id: string } | ReturnType<typeof makeNull>;
								error: ReturnType<typeof makeNull>;
							}> =>
								promiseResolved({
									data: { community_id: publicRow.community_id },
									error: makeNull(),
								}),
						}),
					}),
					update: (): object => ({
						eq: (): object => ({
							select: (): object => ({
								single: (): Promise<{
									data: unknown;
									error: ReturnType<typeof makeNull> | { message: string };
								}> =>
									privateUpdateError
										? promiseResolved({ data: undefined, error: { message: "update failed" } })
										: promiseResolved({ data: {}, error: makeNull() }),
							}),
						}),
					}),
					insert: (): object => ({
						select: (): object => ({
							single: (): Promise<{
								data: unknown;
								error: ReturnType<typeof makeNull>;
							}> => promiseResolved({ data: {}, error: makeNull() }),
						}),
					}),
					delete: (): object => ({
						eq: (): Promise<unknown> => promiseResolved(undefined),
					}),
				};
			}
			if (table === "community_public") {
				return {
					select: (): object => ({
						eq: (): object => ({
							single: (): Promise<{
								data: CommunityPublicRow | ReturnType<typeof makeNull>;
								error: ReturnType<typeof makeNull>;
							}> => promiseResolved({ data: publicRow, error: makeNull() }),
						}),
					}),
					update: (): object => ({
						eq: (): object => ({
							select: (): object => ({
								single: (): Promise<{
									data: CommunityPublicRow | ReturnType<typeof makeNull>;
									error: ReturnType<typeof makeNull> | { message: string };
								}> =>
									publicUpdateError
										? promiseResolved({ data: makeNull(), error: { message: "update failed" } })
										: promiseResolved({ data: publicRow, error: makeNull() }),
							}),
						}),
					}),
					insert: (): object => ({
						select: (): object => ({
							single: (): Promise<{
								data: CommunityPublicRow | ReturnType<typeof makeNull>;
								error: ReturnType<typeof makeNull> | { message: string };
							}> =>
								publicInsertError
									? promiseResolved({ data: makeNull(), error: { message: "insert failed" } })
									: promiseResolved({ data: publicRow, error: makeNull() }),
						}),
					}),
				};
			}
			return {};
		},
	});
}
