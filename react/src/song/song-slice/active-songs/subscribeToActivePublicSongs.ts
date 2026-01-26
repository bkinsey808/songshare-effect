/**
 * Runtime helpers and subscription logic for public songs currently marked active in the
 * local store. This file wires a Supabase Realtime channel to the local Zustand slice so
 * incoming INSERT/UPDATE/DELETE events for `song_public` update the in-memory cache.
 */
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import getSupabaseClientWithAuth from "@/react/supabase/client/getSupabaseClientWithAuth";
import { type Get } from "@/react/zustand/slice-utils";
import isRecord from "@/shared/type-guards/isRecord";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

import { type SongPublic } from "../../song-schema";
import { type SongSubscribeSlice } from "../song-slice";

/**
 * Payload shape emitted by Supabase Realtime for `song_public` table changes.
 * `new` and `old` are typed loosely because runtime validation is performed
 * using the `isSongPublic` type guard before consuming values.
 */
type SongPublicRealtimePayload = {
	/** One of the Postgres events we subscribe to. */
	eventType: "INSERT" | "UPDATE" | "DELETE";
	/** New record when present (INSERT/UPDATE). May be an unknown record at runtime. */
	new?: SongPublic | Record<string, unknown>;
	/** Old record when present (DELETE/UPDATE). May be an unknown record at runtime. */
	old?: SongPublic | Record<string, unknown>;
	/** Any errors returned by the realtime service. */
	errors?: unknown;
};

/**
 * Minimal surface of a Realtime channel used by this module. Kept intentionally small
 * to avoid depending on Supabase client types directly in the slice code.
 */
type RealtimeChannel = {
	on: (
		event: "postgres_changes",
		opts: { event: string; schema: string; table: string; filter: string },
		handler: (payload: Readonly<SongPublicRealtimePayload>) => void,
	) => RealtimeChannel;
	subscribe: (cb?: (status: string, err: unknown) => void) => void;
};

/**
 * Minimal client surface we expect from Supabase's realtime API. This allows
 * runtime checking and graceful degradation when the client doesn't provide
 * the realtime API (e.g., in some test or env configurations).
 */
type SupabaseRealtimeClientLike = {
	channel: (name: string) => RealtimeChannel;
	removeChannel: (channel: RealtimeChannel) => void;
};

/**
 * Remove a deleted public song from both the `publicSongs` map and the
 * `activePublicSongIds` list in a single, immutable state update.
 *
 * The implementation uses object rest destructuring to exclude the deleted key
 * and returns the remaining map. `void _deleted` intentionally silences the
 * unused variable lint while keeping the destructuring readable.
 *
 * @param deletedPublicSongId - id of the public song that was deleted
 * @param set - Zustand `set` function for the SongSubscribeSlice
 */
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
		// Keep the destructured variable to clearly show we intentionally removed it
		void _deleted;
		return {
			publicSongs: rest,
			activePublicSongIds: state.activePublicSongIds.filter(
				(songId) => songId !== deletedPublicSongId,
			),
		};
	});
}

/**
 * Create and manage a Supabase Realtime subscription for the currently active
 * public songs in the store. This function is designed to be used from the
 * SongSubscribeSlice and receives `set`/`get` from the slice initializer.
 *
 * Behaviour summary:
 * - If there are no active IDs, no subscription is created.
 * - If the Supabase client does not expose the realtime API, subscription is skipped.
 * - Listens for INSERT/UPDATE to upsert into `publicSongs` and DELETE to remove entries.
 * - Returns a cleanup function that will remove the realtime channel when invoked.
 *
 * @param set - Zustand `set` function for the SongSubscribeSlice
 * @param get - Zustand `get` function for the SongSubscribeSlice
 * @returns A cleanup function that removes the realtime channel when called.
 */
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

		// Type guards are declared here so they can be reused in the async block
		// without recreating closures on every call.
		function isSupabaseRealtimeClientLike(value: unknown): value is SupabaseRealtimeClientLike {
			if (!isRecord(value)) {
				return false;
			}
			const rec = value;
			// Both methods must exist to be considered a compatible realtime client
			return typeof rec["channel"] === "function" && typeof rec["removeChannel"] === "function";
		}

		function isSongPublic(value: unknown): value is SongPublic {
			if (!isRecord(value)) {
				return false;
			}
			const rec = value;
			// Validate only the minimal fields we need here; more exhaustive validation
			// is performed elsewhere if necessary.
			return (
				Object.hasOwn(rec, "song_id") &&
				typeof rec["song_id"] === "string" &&
				Object.hasOwn(rec, "song_slug") &&
				typeof rec["song_slug"] === "string"
			);
		}

		// Start subscription asynchronously so callers don't need to await it.
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
					// Nothing to subscribe to — avoid creating an open channel with no filters
					console.warn("[subscribeToActivePublicSongs] No activeSongIds, skipping subscription");
					return undefined;
				}

				// Build an `in.` filter for Postgres; escape single quotes in IDs to avoid
				// accidental injection/truncation of the filter string.
				const quoted = activePublicSongIds
					.map((id) => String(id).replaceAll("'", String.raw`\'`))
					.map((id) => `'${id}'`)
					.join(",");
				const filter = `song_id=in.(${quoted})`;

				if (!isSupabaseRealtimeClientLike(client)) {
					// Not all runtime environments expose the realtime API; be defensive.
					console.warn("[subscribeToActivePublicSongs] Supabase client missing realtime API");
					return undefined;
				}

				const supClient = client as SupabaseRealtimeClientLike;

				// Unique channel name reduces the chance of collisions when multiple
				// subscriptions are created during tests or multiple app instances.
				const RANDOM_STRING_BASE = 36;
				const RANDOM_STRING_START = 7;
				const channelName = `song_public_changes_${Date.now()}_${Math.random().toString(RANDOM_STRING_BASE).slice(RANDOM_STRING_START)}`;
				const channel = supClient
					.channel(channelName)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "song_public", filter },
						(payload: Readonly<SongPublicRealtimePayload>) => {
							// Only handle well-formed records; guards protect the store from malformed payloads
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

				// Monitor subscription lifecycle and surface helpful logs for common failures
				channel.subscribe((status: string, err: unknown) => {
					if (String(status) === String(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)) {
						console.warn("[subscribeToActivePublicSongs] Successfully subscribed!");
					} else if (String(status) === String(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR)) {
						const errorMessage = err instanceof Error ? err.message : String(err);
						// Known common failure: realtime is not enabled for the table on the DB side
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

				// Expose a cleanup that removes the channel when the slice is torn down
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
