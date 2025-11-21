// src/features/react/song-subscribe/subscribeToActiveSongs.ts
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";
import { getSupabaseAuthToken } from "@/react/supabase/getSupabaseAuthToken";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

// Supabase realtime payload type for song
type SongPrivateRealtimePayload = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new?: Song & { song_id: string };
	old?: Song & { song_id: string };
};

// Helper function to update state after song deletion
const createDeleteUpdateFunction = (deletedPrivateSongId: string) => {
	return (
		state: ReadonlyDeep<SongSubscribeSlice>,
	): Partial<ReadonlyDeep<SongSubscribeSlice>> => {
		// Create new object without the deleted song
		const newPrivateSongs = Object.fromEntries(
			Object.entries(state.privateSongs).filter(
				([songId]) => songId !== deletedPrivateSongId,
			),
		);
		const newActiveIds = state.activePrivateSongIds.filter(
			(songId) => songId !== deletedPrivateSongId,
		);
		return {
			privateSongs: newPrivateSongs,
			activePrivateSongIds: newActiveIds,
		};
	};
};

export default function subscribeToActivePrivateSongs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((
					state: ReadonlyDeep<SongSubscribeSlice>,
			  ) => Partial<SongSubscribeSlice>),
	) => void,
	get: () => SongSubscribeSlice,
): () => (() => void) | undefined {
	return (): (() => void) | undefined => {
		let unsubscribeFn: (() => void) | undefined;

		// Get authentication token asynchronously
		void getSupabaseAuthToken()
			.then((userToken) => {
				const client = getSupabaseClient(userToken);

				if (client === undefined) {
					console.warn("[subscribeToActivePrivateSongs] No Supabase client");
					return undefined;
				}

				const { activePrivateSongIds, addOrUpdatePrivateSongs } = get();

				if (
					!Array.isArray(activePrivateSongIds) ||
					activePrivateSongIds.length === 0
				) {
					console.warn(
						"[subscribeToActivePrivateSongs] No activeSongIds, skipping subscription",
					);
					return undefined;
				}

				const filter = `song_id=in.(${activePrivateSongIds.join(",")})`;

				const channel = client
					.channel("song_private_changes")
					.on(
						"postgres_changes" as "system",
						{
							event: "*",
							schema: "private",
							table: "song_private",
							filter,
						},
						(payload: Readonly<SongPrivateRealtimePayload>) => {
							switch (payload.eventType) {
								case "INSERT":
								case "UPDATE":
									if (payload.new && payload.new.song_id) {
										addOrUpdatePrivateSongs({
											[payload.new.song_id]: payload.new,
										});
									}
									break;
								case "DELETE": {
									const deletedPrivateSongId = payload.old?.song_id;
									if (
										deletedPrivateSongId !== undefined &&
										deletedPrivateSongId !== ""
									) {
										// Use helper function to reduce nesting
										const updateFunction =
											createDeleteUpdateFunction(deletedPrivateSongId);
										set(updateFunction);
									}
									break;
								}
								default:
									break;
							}
						},
					)
					.subscribe((status: string, err: unknown) => {
						// Log channel status for debugging
						// eslint-disable-next-line no-console
						console.log(
							`[subscribeToActivePrivateSongs] Channel status: ${status}`,
							err ?? "",
						);
						if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
							// eslint-disable-next-line no-console
							console.log(
								"[subscribeToActivePrivateSongs] Successfully subscribed!",
							);
						} else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
							console.error(
								"[subscribeToActivePrivateSongs] Channel error:",
								err,
							);
						} else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
							console.warn(
								"[subscribeToActivePrivateSongs] Subscription timed out",
							);
						}
					});

				unsubscribeFn = () => {
					void client.removeChannel(channel);
				};
				return undefined;
			})
			.catch((error: unknown) => {
				console.error(
					"[subscribeToActivePrivateSongs] Failed to get auth token:",
					error,
				);
			});

		// Return a function that calls the unsubscribe function when available
		return (): void => {
			if (unsubscribeFn) {
				unsubscribeFn();
			}
		};
	};
}
