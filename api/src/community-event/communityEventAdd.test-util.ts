/**
 * Test helper for communityEventAdd - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

export default function makeCommunityEventAddClient(opts: {
	requesterRole?: "owner" | "community_admin" | "member";
	requesterRoleError?: boolean;
	insertEventError?: boolean;
	communityMembers?: { user_id: string }[];
	eventUserInsertError?: boolean;
} = {}): ReturnType<typeof createClient> {
	const role = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const insertEventError = opts.insertEventError ?? false;
	const communityMembers = opts.communityMembers ?? [];
	const eventUserInsertError = opts.eventUserInsertError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (cols: string): object =>
						cols.includes("role")
							? {
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
								}
							: {
									eq: (): object => ({
										eq: (): Promise<{
											data: { user_id: string }[];
											error: ReturnType<typeof makeNull>;
										}> => promiseResolved({ data: communityMembers, error: makeNull() }),
									}),
								},
				};
			}
			if (table === "community_event") {
				return {
					insert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						insertEventError
							? promiseResolved({ error: { message: "insert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			if (table === "event_user") {
				return {
					insert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						eventUserInsertError
							? promiseResolved({ error: { message: "insert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}
