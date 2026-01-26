import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import getSupabaseClientWithAuth from "@/react/supabase/client/getSupabaseClientWithAuth";
import { type Get } from "@/react/zustand/slice-utils";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

import { type SongPublic } from "../../song-schema";
import { type SongSubscribeSlice } from "../song-slice";

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
	removeChannel: (channel: RealtimeChannel) => void;
};

function handleSongDeletion(
	deletedPublicSongId: string,
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
): void {
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
}

export default function subscribeToActivePublicSongs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: Get<SongSubscribeSlice>,
) {
	return (): (() => void) | undefined => {
		let unsubscribeFn: (() => void) | undefined = undefined;

		// Type guards moved to the enclosing scope to avoid nested function declarations
		function isSupabaseRealtimeClientLike(value: unknown): value is SupabaseRealtimeClientLike {
			if (!isRecord(value)) {
				return false;
			}
			const rec = value;
			return typeof rec["channel"] === "function" && typeof rec["removeChannel"] === "function";
		}

		function isSongPublic(value: unknown): value is SongPublic {
			if (!isRecord(value)) {
				return false;
			}
			const rec = value;
			return (
				Object.hasOwn(rec, "song_id") &&
				typeof rec["song_id"] === "string" &&
				Object.hasOwn(rec, "song_slug") &&
				typeof rec["song_slug"] === "string"
			);
		}

		void (async (): Promise<void> => {
			try {
				const client = await getSupabaseClientWithAuth();
				if (!client) {
					console.warn("[subscribeToActivePublicSongs] No Supabase client available");
					return undefined;
				}

				const { activePublicSongIds, addOrUpdatePublicSongs } = get();

				const NO_ACTIVE_IDS = 0;

				if (!Array.isArray(activePublicSongIds) || activePublicSongIds.length === NO_ACTIVE_IDS) {
					console.warn("[subscribeToActivePublicSongs] No activeSongIds, skipping subscription");
					return undefined;
				}

				const quoted = activePublicSongIds
					.map((id) => String(id).replaceAll("'", String.raw`\'`))
					.map((id) => `'${id}'`)
					.join(",");
				const filter = `song_id=in.(${quoted})`;

				if (!isSupabaseRealtimeClientLike(client)) {
					console.warn("[subscribeToActivePublicSongs] Supabase client missing realtime API");
					return undefined;
				}

				const supClient = client as SupabaseRealtimeClientLike;

				// Use unique channel name to avoid conflicts with multiple subscriptions
				const RANDOM_STRING_BASE = 36;
				const RANDOM_STRING_START = 7;
				const channelName = `song_public_changes_${Date.now()}_${Math.random().toString(RANDOM_STRING_BASE).slice(RANDOM_STRING_START)}`;
				const channel = supClient
					.channel(channelName)
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
					if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
						console.warn("[subscribeToActivePublicSongs] Successfully subscribed!");
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)) {
						const errorMessage = err instanceof Error ? err.message : String(err);
						if (errorMessage.includes("mismatch between server and client bindings")) {
							console.error(
								"[subscribeToActivePublicSongs] Realtime not enabled for song_public table. " +
									"Please run migration: 20260124000000_enable_song_public_realtime.sql",
							);
						} else {
							console.error("[subscribeToActivePublicSongs] Channel error:", err);
						}
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.TIMED_OUT)) {
						console.warn("[subscribeToActivePublicSongs] Subscription timed out");
					} else {
						console.warn(`[subscribeToActivePublicSongs] Channel status: ${status}`, err ?? "");
					}
				});

				unsubscribeFn = (): void => {
					supClient.removeChannel(channel);
				};

				return undefined;
			} catch (error: unknown) {
				console.error("[subscribeToActivePublicSongs] Failed to get Supabase client:", error);
			}
		})();

		return (): void => {
			console.warn(
				"[subscribeToActivePublicSongs] cleanup invoked; unsubscribeFn:",
				typeof unsubscribeFn,
				unsubscribeFn,
			);
			if (unsubscribeFn) {
				unsubscribeFn();
			}
		};
	};
}
