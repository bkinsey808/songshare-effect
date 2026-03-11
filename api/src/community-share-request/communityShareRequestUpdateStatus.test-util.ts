/**
 * Test helper for communityShareRequestUpdateStatus - builds a Supabase client stub.
 */
import type { createClient } from "@supabase/supabase-js";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

type SharedItemType = "song" | "playlist";

export default function makeCommunityShareRequestUpdateStatusClient(opts: {
	requestNotFound?: boolean;
	requestNotPending?: boolean;
	requesterRole?: "owner" | "community_admin" | "member";
	requesterRoleError?: boolean;
	updateError?: boolean;
	addSongError?: boolean;
	addPlaylistError?: boolean;
	sharedItemType?: SharedItemType;
} = {}): ReturnType<typeof createClient> {
	const requestNotFound = opts.requestNotFound ?? false;
	const requestNotPending = opts.requestNotPending ?? false;
	const role = opts.requesterRole ?? "owner";
	const requesterRoleError = opts.requesterRoleError ?? false;
	const updateError = opts.updateError ?? false;
	const addSongError = opts.addSongError ?? false;
	const addPlaylistError = opts.addPlaylistError ?? false;
	const sharedItemType = opts.sharedItemType ?? "song";

	const requestData = {
		community_id: "community-1",
		shared_item_type: sharedItemType,
		shared_item_id: sharedItemType === "song" ? "song-1" : "playlist-1",
		status: requestNotPending ? "accepted" : "pending",
	};

	return forceCast<ReturnType<typeof createClient>>({
		from: (table: string): object => {
			if (table === "community_share_request") {
				return {
					select: (): object => ({
						eq: (): object => ({
							single: (): Promise<{
								data: typeof requestData | null;
								error: ReturnType<typeof makeNull> | { message: string };
							}> =>
								requestNotFound
									? promiseResolved({ data: makeNull(), error: { message: "PGRST116" } })
									: promiseResolved({ data: requestData, error: makeNull() }),
						}),
					}),
					update: (): object => ({
						eq: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
							updateError
								? promiseResolved({ error: { message: "update failed" } })
								: promiseResolved({ error: makeNull() }),
					}),
				};
			}
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
			if (table === "community_song") {
				return {
					upsert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						addSongError
							? promiseResolved({ error: { message: "upsert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			if (table === "community_playlist") {
				return {
					upsert: (): Promise<{ error: ReturnType<typeof makeNull> | { message: string } }> =>
						addPlaylistError
							? promiseResolved({ error: { message: "upsert failed" } })
							: promiseResolved({ error: makeNull() }),
				};
			}
			return {};
		},
	});
}
