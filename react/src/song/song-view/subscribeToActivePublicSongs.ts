import type { AppSlice } from "@/react/zustand/useAppStore";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { getSupabaseClientWithAuth } from "@/react/supabase/supabaseClient";
import { isRecord } from "@/shared/utils/typeGuards";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import { type SongPublic } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";

type SongPublicRealtimePayload = {
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new?: SongPublic | Record<string, unknown>;
	old?: SongPublic | Record<string, unknown>;
	errors?: unknown;
};

type RealtimeChannel = {
	on: (
		event: "postgres_changes",
		opts: { event: string; schema: string; table: string; filter: string },
		handler: (payload: Readonly<SongPublicRealtimePayload>) => void,
	) => RealtimeChannel;
	subscribe: (cb?: (status: string, err: unknown) => void) => void;
};

type SupabaseRealtimeClientLike = {
	channel: (name: string) => RealtimeChannel;
	removeChannel: (c: RealtimeChannel) => void;
};

const handleSongDeletion = (
	deletedPublicSongId: string,
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((
					state: ReadonlyDeep<SongSubscribeSlice>,
			  ) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
) => {
	set((state) => {
		const { [deletedPublicSongId]: _deleted, ...rest } = state.publicSongs;
		void _deleted;
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
	get: () => SongSubscribeSlice & AppSlice,
) {
	return (): (() => void) | undefined => {
		let unsubscribeFn: (() => void) | undefined;

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

				const quoted = activePublicSongIds
					.map((id) => String(id).replace(/'/g, "\\'"))
					.map((id) => `'${id}'`)
					.join(",");
				const filter = `song_id=in.(${quoted})`;

				function isSupabaseRealtimeClientLike(
					x: unknown,
				): x is SupabaseRealtimeClientLike {
					if (!isRecord(x)) return false;
					const rec = x;
					return (
						typeof rec["channel"] === "function" &&
						typeof rec["removeChannel"] === "function"
					);
				}

				function isSongPublic(x: unknown): x is SongPublic {
					if (!isRecord(x)) return false;
					const rec = x;
					return (
						Object.prototype.hasOwnProperty.call(rec, "song_id") &&
						typeof rec["song_id"] === "string" &&
						Object.prototype.hasOwnProperty.call(rec, "song_slug") &&
						typeof rec["song_slug"] === "string"
					);
				}

				if (!isSupabaseRealtimeClientLike(client)) {
					console.warn(
						"[subscribeToActivePublicSongs] Supabase client missing realtime API",
					);
					return undefined;
				}

				const supClient = client as SupabaseRealtimeClientLike;

				const channel = supClient
					.channel("song_public_changes")
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "song_public", filter },
						(payload: Readonly<SongPublicRealtimePayload>) => {
							switch (payload.eventType) {
								case "INSERT":
								case "UPDATE": {
									const newSong = payload.new;
									if (newSong !== undefined && isSongPublic(newSong)) {
										const id = String(newSong.song_id);
										addOrUpdatePublicSongs({ [id]: newSong });
									}
									break;
								}
								case "DELETE": {
									const oldSong = payload.old;
									if (oldSong !== undefined && isSongPublic(oldSong)) {
										handleSongDeletion(String(oldSong.song_id), set);
									}
									break;
								}
							}
						},
					);

				channel.subscribe((status: string, err: unknown) => {
					console.log(
						`[subscribeToActivePublicSongs] Channel status: ${status}`,
						err ?? "",
					);
					if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
						console.log(
							"[subscribeToActivePublicSongs] Successfully subscribed!",
						);
					} else if (
						String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)
					) {
						console.error("[subscribeToActivePublicSongs] Channel error:", err);
					} else if (
						String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)
					) {
						console.warn(
							"[subscribeToActivePublicSongs] Subscription timed out",
						);
					}
				});

				unsubscribeFn = () => {
					supClient.removeChannel(channel);
				};

				return undefined;
			})
			.catch((error: unknown) => {
				console.error(
					"[subscribeToActivePublicSongs] Failed to get Supabase client:",
					error,
				);
			});

		return (): void => {
			if (unsubscribeFn) {
				unsubscribeFn();
			}
		};
	};
}
