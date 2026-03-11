/**
 * Test helper for shareUpdateStatus - builds a Supabase client stub.
 * Returns share details for getShareForRecipient; update succeeds.
 */
import { vi } from "vitest";

import type getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

type ShareRow = {
	data: {
		shared_item_type: string;
		shared_item_id: string;
		shared_item_name: string;
		sender_user_id: string;
		recipient_user_id: string;
		status: string;
	};
	error: ReturnType<typeof makeNull>;
};

const RECIPIENT_ID = "recipient-1";

function makeShareUpdateStatusClient(shareDetails: {
	shared_item_type: string;
	shared_item_id: string;
	sender_user_id: string;
}): ReturnType<typeof getSupabaseServerClient> {
	const updateSpy = vi.fn().mockResolvedValue({ error: makeNull() });
	const insertSpy = vi.fn().mockResolvedValue({ error: makeNull() });

	const stub = {
		from: (table: string): object => {
			if (table === "share_public") {
				return {
					select: (): object => ({
						eq: (): object => ({
							single: (): Promise<ShareRow> =>
								promiseResolved({
									data: {
										shared_item_type: shareDetails.shared_item_type,
										shared_item_id: shareDetails.shared_item_id,
										shared_item_name: "Item",
										sender_user_id: shareDetails.sender_user_id,
										recipient_user_id: RECIPIENT_ID,
										status: "pending",
									},
									error: makeNull(),
								}),
						}),
					}),
					update: (obj: unknown): object => {
						updateSpy(obj);
						return {
							eq: (): Promise<{ error: ReturnType<typeof makeNull> }> =>
								promiseResolved({ error: makeNull() }),
						};
					},
				};
			}
			if (
				table === "song_library" ||
				table === "playlist_library" ||
				table === "event_library" ||
				table === "user_library" ||
				table === "community_user"
			) {
				return {
					insert: (rows: unknown[]): Promise<{ error: ReturnType<typeof makeNull> }> => {
						insertSpy(rows);
						return promiseResolved({ error: makeNull() });
					},
				};
			}
			return {};
		},
	};
	return forceCast<ReturnType<typeof getSupabaseServerClient>>(stub);
}

export default makeShareUpdateStatusClient;
export { RECIPIENT_ID };
