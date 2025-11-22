// src/features/react/song-subscribe/subscribeToActiveSongs.ts
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import escapeForPostgresLiteral from "../../supabase/escapeForPostgresLiteral";
import { type SongPublic } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";
import { getSupabaseClientWithAuth } from "@/react/supabase/supabaseClient";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

// Supabase realtime payload type for song_public
type SongPublicRealtimePayload = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new?: SongPublic | Record<string, unknown>;
	old?: SongPublic | Record<string, unknown>;
	errors?: unknown;
};

// Helper function to handle song deletion
const handleSongDeletion = (
	deletedPublicSongId: string,
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((
					state: ReadonlyDeep<SongSubscribeSlice>,
			  ) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
): void => {
	set((state) => {
		const { [deletedPublicSongId]: deletedSong, ...rest } = state.publicSongs;
		// deletedSong is intentionally unused - we just need to remove it
		void deletedSong;
		return {
			publicSongs: rest,
			activePublicSongIds: state.activePublicSongIds.filter(
				(songId) => songId !== deletedPublicSongId,
			),
		};
	});
};

export default function subscribeToActivePublicSongs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((
					state: ReadonlyDeep<SongSubscribeSlice>,
			  ) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (): (() => void) | undefined => {
		let unsubscribeFn: (() => void) | undefined;

		// Get Supabase client with automatic authentication
		void getSupabaseClientWithAuth()
			.then((client) => {
				if (!client) {
					console.warn(
						"[subscribeToActivePublicSongs] No Supabase client available",
					);
					return undefined;
				}

				const { activePublicSongIds, addOrUpdatePublicSongs } = get();

				if (
					!Array.isArray(activePublicSongIds) ||
					activePublicSongIds.length === 0
				) {
					console.warn(
						"[subscribeToActivePublicSongs] No activeSongIds, skipping subscription",
					);
					return undefined;
				}

				// Quote string ids for postgres IN syntax: in.('id1','id2')
				const quoted = activePublicSongIds
					.map((id) => escapeForPostgresLiteral(id))
					.map((id) => `'${id}'`)
					.join(",");
				const filter = `song_id=in.(${quoted})`;

				const channel = client
					.channel("song_public_changes")
					.on(
						"postgres_changes",
						{
							event: "*",
							schema: "public",
							table: "song_public",
							filter,
						},
						(payload: ReadonlyDeep<SongPublicRealtimePayload>) => {
							switch (payload.eventType) {
								case "INSERT":
								case "UPDATE": {
									const newSong = payload.new;
									if (
										newSong !== undefined &&
										typeof newSong === "object" &&
										"song_id" in newSong &&
										typeof newSong.song_id === "string"
									) {
										addOrUpdatePublicSongs({
											[newSong.song_id]: newSong as SongPublic,
										});
									}
									break;
								}
								case "DELETE": {
									const oldSong = payload.old;
									if (
										oldSong !== undefined &&
										typeof oldSong === "object" &&
										"song_id" in oldSong &&
										typeof oldSong.song_id === "string"
									) {
										handleSongDeletion(oldSong.song_id, set);
									}
									break;
								}
							}
						},
					)
					.subscribe((status: string, err?: unknown) => {
						console.warn(
							`[subscribeToActivePublicSongs] Channel status: ${status}`,
							err ?? "",
						);
						if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
							console.warn(
								"[subscribeToActivePublicSongs] Successfully subscribed!",
							);
						} else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
							console.error(
								"[subscribeToActivePublicSongs] Channel error:",
								err,
							);
						} else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
							console.warn(
								"[subscribeToActivePublicSongs] Subscription timed out",
							);
						}
					});

				unsubscribeFn = () => {
					void client.removeChannel(channel);
				};

				return channel;
			})
			.catch((error: unknown) => {
				console.error(
					"[subscribeToActivePublicSongs] Failed to get Supabase client:",
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
