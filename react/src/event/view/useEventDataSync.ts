import { Effect as EffectRuntime, type Effect } from "effect";
import { useEffect } from "react";

type UseEventDataSyncParams = {
	eventSlug: string | undefined;
	activePlaylistId: string | null | undefined;
	fetchEventBySlug: (eventSlug: string) => Effect.Effect<void, unknown>;
	fetchPlaylistById: (playlistId: string) => Effect.Effect<void, unknown>;
};

/**
 * Synchronizes event and active playlist data for the event view.
 *
 * @param eventSlug - Event slug used to fetch the current event
 * @param activePlaylistId - Active playlist id used to fetch playlist details
 * @param fetchEventBySlug - Store action that loads event data by slug
 * @param fetchPlaylistById - Store action that loads playlist data by id
 * @returns Nothing; this hook performs side effects only
 */
export default function useEventDataSync({
	eventSlug,
	activePlaylistId,
	fetchEventBySlug,
	fetchPlaylistById,
}: Readonly<UseEventDataSyncParams>): void {
	// Fetch the active playlist details when a playlist id is present.
	useEffect(() => {
		if (activePlaylistId !== null && activePlaylistId !== undefined) {
			void EffectRuntime.runPromise(fetchPlaylistById(activePlaylistId));
		}
	}, [activePlaylistId, fetchPlaylistById]);

	// Fetch the event details when a valid event slug is available.
	useEffect(() => {
		if (eventSlug === undefined || eventSlug === "") {
			return;
		}

		const slug = eventSlug;

		async function loadEvent(): Promise<void> {
			try {
				await EffectRuntime.runPromise(fetchEventBySlug(slug));
			} catch {
				// Error is handled in the app store state
			}
		}

		void loadEvent();
	}, [eventSlug, fetchEventBySlug]);
}
