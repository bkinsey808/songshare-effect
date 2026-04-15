import { Effect as EffectRuntime } from "effect";

/**
 * Refreshes the current event by slug using the provided store action.
 *
 * This is extracted into its own module so other helpers (like runAction) can
 * depend on it without importing `useEventManageState` and creating a cycle.
 *
 * @param event_slug - slug of the event to refresh (may be undefined)
 * @param fetchEventBySlug - effect-producing function that fetches the event
 * @returns void
 */
export default async function refreshEvent(
	event_slug: string | undefined,
	fetchEventBySlug: (eventSlug: string) => EffectRuntime.Effect<void, unknown>,
): Promise<void> {
	if (event_slug !== undefined && event_slug !== "") {
		await EffectRuntime.runPromise(fetchEventBySlug(event_slug));
	}
}
