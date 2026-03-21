/**
 * Test helper for communityUserAdd - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

/**
 * Test helper for communityUserAdd - builds a Supabase client stub.
 *
 * @param requesterRole - Role of the user requesting the add
 * @param requesterRoleError - Whether to simulate an error fetching requester role
 * @param targetUserExists - Whether to simulate the target user existing in the system
 * @param existingMembership - Existing membership status for the target user
 * @param upsertError - Whether to simulate an error during upsert
 * @param communityEvents - List of events in the community to auto-add the user to
 * @returns A mocked Supabase client
 */
export default function makeCommunityUserAddClient(
	opts: {
		requesterRole?: "owner" | "community_admin" | "member";
		requesterRoleError?: boolean;
		targetUserExists?: boolean;
		existingMembership?: { status: "joined" | "invited" | "kicked" | "left" } | null;
		upsertError?: boolean;
		communityEvents?: { event_id: string }[];
	} = {},
): ReturnType<typeof createClient> {
	const requesterRole = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const targetUserExists = opts.targetUserExists ?? true;
	const existingMembership = opts.existingMembership ?? makeNull();
	const upsertError = opts.upsertError ?? false;
	const communityEvents = opts.communityEvents ?? [];

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
										: promiseResolved({ data: { role: requesterRole }, error: makeNull() }),
								maybeSingle: (): Promise<{
									data: { status: string } | null;
									error: ReturnType<typeof makeNull>;
								}> =>
									promiseResolved({
										data: existingMembership,
										error: makeNull(),
									}),
							}),
						}),
					}),
					upsert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						upsertError
							? promiseResolved({ error: { message: "upsert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			if (table === "user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							single: (): Promise<{
								data: { user_id: string } | ReturnType<typeof makeNull>;
								error: ReturnType<typeof makeNull> | { message: string };
							}> =>
								targetUserExists
									? promiseResolved({ data: { user_id: "target" }, error: makeNull() })
									: promiseResolved({ data: makeNull(), error: { message: "PGRST116" } }),
						}),
					}),
				};
			}
			if (table === "community_event") {
				return {
					select: (): object => ({
						eq: (): Promise<{ data: { event_id: string }[] | null; error: unknown }> =>
							promiseResolved({ data: communityEvents, error: makeNull() }),
					}),
				};
			}
			if (table === "event_user") {
				return {
					insert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}
