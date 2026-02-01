import { type SongPublic } from "@/react/song/song-schema";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

import { type SongSubscribeSlice } from "../song-slice";

/**
 * Update the store with a batch of public songs and ensure subscriptions
 * reflect the new active set.
 *
 * This function performs three key side-effects:
 * 1. Adds or updates the provided `publicSongsToAdd` in the store.
 * 2. Builds a deduplicated list of active public song IDs combining the
 *    existing active IDs with the newly added ones.
 * 3. Tears down any previous subscription and subscribes to the new
 *    active set, returning a safe unsubscribe function (no-op when
 *    the underlying subscription API returns `undefined`).
 *
 * @param publicSongsToAdd - Map of song ID -> `SongPublic` records to add
 * @param state - Read-only slice containing helpers for adding songs and
 *   managing the active public songs subscription
 * @param set - State updater function (compatible with Zustand-style set)
 * @returns newActivePublicSongIds - deduplicated list of active public song IDs
 * @returns activePublicSongsUnsubscribe - a function to unsubscribe from
 *   active public songs; it will be a no-op if no subscription was created
 */
export default function updateStoreWithPublicSongs({
	publicSongsToAdd,
	state,
	set,
}: ReadonlyDeep<{
	publicSongsToAdd: Readonly<Record<string, SongPublic>>;
	state: Readonly<
		SongSubscribeSlice & {
			subscribeToActivePublicSongs: () => (() => void) | undefined;
			activePublicSongsUnsubscribe?: () => void;
		}
	>;
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void;
}>): {
	newActivePublicSongIds: readonly string[];
	activePublicSongsUnsubscribe: () => void;
} {
	// Developer-facing debug log to help track when the active set is updated.
	console.warn("[updateStoreWithPublicSongs] Updating store with songs:", publicSongsToAdd);

	// Merge the provided songs into the central store. Implementations of
	// `addOrUpdatePublicSongs` should handle idempotency for existing songs.
	state.addOrUpdatePublicSongs(publicSongsToAdd);

	/** Deduplicated combination of existing active IDs and newly added ones. */
	const newActivePublicSongIds: readonly string[] = [
		...new Set([...state.activePublicSongIds, ...Object.keys(publicSongsToAdd)]),
	];

	// Clean up any previous subscription to avoid duplicate handlers or leaks.
	if (typeof state.activePublicSongsUnsubscribe === "function") {
		state.activePublicSongsUnsubscribe();
	}

	// Request a new subscription for the (now-updated) active set. The
	// subscription function may return an unsubscribe function or `undefined`.
	const activePublicSongsUnsubscribe = state.subscribeToActivePublicSongs();

	// Persist the unsubscribe function (or a safe no-op) and update the
	// active IDs in the store in a single atomic set operation.
	set(() => ({
		activePublicSongsUnsubscribe: activePublicSongsUnsubscribe ?? ((): undefined => undefined),
		activePublicSongIds: newActivePublicSongIds,
	}));

	// Return the computed values for callers that may want to use them
	// directly (the unsubscribe is normalized to always be callable).
	return {
		newActivePublicSongIds,
		activePublicSongsUnsubscribe: activePublicSongsUnsubscribe ?? (() => undefined),
	};
}
