/**
 * Test helper for eventUserKick - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

export default function makeEventUserKickClient(
	requesterId: string,
	opts: {
		requesterRole?: "owner" | "event_admin" | "event_playlist_admin" | "participant";
		targetRole?: "owner" | "event_admin" | "event_playlist_admin" | "participant";
		targetError?: boolean;
		updateError?: boolean;
	} = {},
): ReturnType<typeof createClient> {
	const requesterRole = opts.requesterRole ?? "owner";
	const targetRole = opts.targetRole ?? "participant";
	const targetError = opts.targetError ?? false;
	const updateError = opts.updateError ?? false;

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "event_user") {
				return {
					select: (): object => ({
						eq: (): object => ({
							eq: (
								_col: string,
								userId: string,
							): {
								single?: () => Promise<{
									data: { role: string } | null;
									error: ReturnType<typeof makeNull> | { message: string };
								}>;
							} => {
								const isRequester = userId === requesterId;
								if (isRequester) {
									return {
										single: (): Promise<{
											data: { role: string } | null;
											error: ReturnType<typeof makeNull> | { message: string };
										}> =>
											promiseResolved({ data: { role: requesterRole }, error: makeNull() }),
									};
								}
								if (targetError) {
									return {
										single: (): Promise<{
											data: { role: string } | null;
											error: ReturnType<typeof makeNull> | { message: string };
										}> =>
											promiseResolved({ data: makeNull(), error: { message: "PGRST116" } }),
									};
								}
								return {
									single: (): Promise<{
										data: { role: string } | null;
										error: ReturnType<typeof makeNull> | { message: string };
									}> =>
										promiseResolved({ data: { role: targetRole }, error: makeNull() }),
								};
							},
						}),
					}),
					update: (): object => ({
						eq: (): object => ({
							eq: (): Promise<{
								error: ReturnType<typeof makeNull> | { message: string };
							}> =>
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
