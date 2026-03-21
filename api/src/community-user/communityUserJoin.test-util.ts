/**
 * Test helper for communityUserJoin - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

type ExistingMember = { status: "joined" | "invited" | "kicked" | "left"; role?: string };

/**
 * Test helper for communityUserJoin - builds a Supabase client stub.
 *
 * @param existingMember - Data for the existing community member, or null if not a member
 * @param joinUpdateOrInsertError - Whether to simulate an error during join update/insert
 * @param communityEvents - List of events in the community to auto-join
 * @param eventUserInsertError - Whether to simulate an error joining events
 * @returns A mocked Supabase client
 */
export default function makeCommunityUserJoinClient(
	opts: {
		existingMember?: ExistingMember | null;
		joinUpdateOrInsertError?: boolean;
		communityEvents?: { event_id: string }[];
		eventUserInsertError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const {
		existingMember,
		joinUpdateOrInsertError = false,
		communityEvents = [],
		eventUserInsertError = false,
	} = opts;
	const joinError = joinUpdateOrInsertError;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (): object => ({
								maybeSingle: (): Promise<{
									data: ExistingMember | null;
									error: ReturnType<typeof makeNull> | { message: string };
								}> =>
									promiseResolved({
										data: existingMember ?? makeNull(),
										error: makeNull(),
									}),
							}),
						}),
					}),
					update: (): object => ({
						eq: (): object => ({
							eq: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
								joinError
									? promiseResolved({ error: { message: "update failed" } })
									: promiseResolved({ error: makeNull() }),
						}),
					}),
					insert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						joinError
							? promiseResolved({ error: { message: "insert failed" } })
							: promiseResolved({ error: makeNull() }),
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
						eventUserInsertError
							? promiseResolved({ error: { message: "insert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}
