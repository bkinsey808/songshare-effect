// src/features/react/song-subscribe/subscribeToActiveSongs.ts
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import { type Get } from "@/react/zustand/slice-utils";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./song-slice";

// Supabase realtime payload type for song
type SongPrivateRealtimePayload = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new?: Song & { song_id: string };
	old?: Song & { song_id: string };
};

// Minimal local typings for the subset of Supabase realtime API used here.
type RealtimeChannel = {
	on: (
		event: "postgres_changes",
		opts: { event: string; schema: string; table: string; filter: string },
		handler: (payload: Readonly<SongPrivateRealtimePayload>) => void,
	) => RealtimeChannel;

	subscribe: (cb?: (status: string, err: unknown) => void) => void;
};

type SupabaseRealtimeClientLike = {
	channel: (name: string) => RealtimeChannel;
	removeChannel: (channel: RealtimeChannel) => void;
};

// Helper function to update state after song deletion
function createDeleteUpdateFunction(deletedPrivateSongId: string) {
	return (state: ReadonlyDeep<SongSubscribeSlice>): Partial<ReadonlyDeep<SongSubscribeSlice>> => {
		// Create new object without the deleted song
		const newPrivateSongs = Object.fromEntries(
			Object.entries(state.privateSongs).filter(([songId]) => songId !== deletedPrivateSongId),
		);
		const newActiveIds = state.activePrivateSongIds.filter(
			(songId) => songId !== deletedPrivateSongId,
		);
		return {
			privateSongs: newPrivateSongs,
			activePrivateSongIds: newActiveIds,
		};
	};
}

export default function subscribeToActivePrivateSongs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<SongSubscribeSlice>),
	) => void,
	get: Get<SongSubscribeSlice>,
): () => (() => void) | undefined {
	return (): (() => void) | undefined => {
		let unsubscribeFn: (() => void) | undefined = undefined;

		// Helper type guard moved to enclosing scope to avoid nested function declarations
		function isSupabaseRealtimeClientLike(value: unknown): value is SupabaseRealtimeClientLike {
			if (!isRecord(value)) {
				return false;
			}
			const rec = value;
			return typeof rec["channel"] === "function" && typeof rec["removeChannel"] === "function";
		}

		// Get authentication token asynchronously
		void (async (): Promise<void> => {
			try {
				const userToken = await getSupabaseAuthToken();

				const client = getSupabaseClient(userToken);

				if (client === undefined) {
					console.warn("[subscribeToActivePrivateSongs] No Supabase client");
					return undefined;
				}

				const { activePrivateSongIds, addOrUpdatePrivateSongs } = get();

				const NO_ACTIVE_IDS = 0;

				if (!Array.isArray(activePrivateSongIds) || activePrivateSongIds.length === NO_ACTIVE_IDS) {
					console.warn("[subscribeToActivePrivateSongs] No activeSongIds, skipping subscription");
					return undefined;
				}

				const filter = `song_id=in.(${activePrivateSongIds.join(",")})`;

				// Narrow the supabase client to a minimal, well-typed shape we use here.

				if (!isSupabaseRealtimeClientLike(client)) {
					console.warn("[subscribeToActivePrivateSongs] Supabase client missing realtime API");
					return undefined;
				}

				const supClient = client as SupabaseRealtimeClientLike;

				const channel = supClient.channel("song_private_changes").on(
					"postgres_changes",
					{
						event: "*",
						schema: "private",
						table: "song_private",
						filter,
					},
					(payload: Readonly<SongPrivateRealtimePayload>) => {
						switch (payload.eventType) {
							case "INSERT":
							case "UPDATE": {
								if (payload.new && payload.new.song_id) {
									addOrUpdatePrivateSongs({
										[payload.new.song_id]: payload.new,
									});
								}
								break;
							}
							case "DELETE": {
								const deletedPrivateSongId = payload.old?.song_id;
								if (deletedPrivateSongId !== undefined && deletedPrivateSongId !== "") {
									// Use helper function to reduce nesting
									const updateFunction = createDeleteUpdateFunction(deletedPrivateSongId);
									set(updateFunction);
								}
								break;
							}
							// No default branch needed — all event types are handled above.
						}
					},
				);

				// subscribe is separate to keep types explicit
				channel.subscribe((status: string, err: unknown) => {
					// Log channel status for debugging
					console.warn(`[subscribeToActivePrivateSongs] Channel status: ${status}`, err ?? "");
					if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
						console.warn("[subscribeToActivePrivateSongs] Successfully subscribed!");
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)) {
						console.error("[subscribeToActivePrivateSongs] Channel error:", err);
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)) {
						console.warn("[subscribeToActivePrivateSongs] Subscription timed out");
					}
				});

				unsubscribeFn = (): void => {
					supClient.removeChannel(channel);
				};
				return undefined;
			} catch (error: unknown) {
				console.error("[subscribeToActivePrivateSongs] Failed to get auth token:", error);
			}
		})();

		// Return a function that calls the unsubscribe function when available
		return (): void => {
			if (unsubscribeFn) {
				unsubscribeFn();
			}
		};
	};
}
