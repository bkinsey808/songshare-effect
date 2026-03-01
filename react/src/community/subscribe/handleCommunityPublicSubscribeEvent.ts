import { Effect } from "effect";

import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";
import isRecord from "@/shared/type-guards/isRecord";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Handles realtime UPDATE events for `community_public` scoped to a
 * specific community. Patches `currentCommunity` in the slice with the
 * incoming field values (notably `active_event_id`).
 *
 * @param payload - The raw realtime event payload
 * @param get - Getter for the CommunitySlice
 * @returns An Effect that applies the state change
 */
export default function handleCommunityPublicSubscribeEvent(
	payload: unknown,
	get: () => CommunitySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* handleCommunityPublicGen($) {
		if (!isRealtimePayload(payload)) {
			return;
		}

		const { eventType } = payload as Record<string, unknown>;

		if (eventType === "UPDATE") {
			const raw = (payload as Record<string, unknown>)["new"];
			if (!isRecord(raw)) {
				return;
			}

			const { currentCommunity, setCurrentCommunity } = get();
			if (currentCommunity === undefined) {
				return;
			}

			const incoming: Record<string, unknown> = raw;
			const newActiveEventId =
				typeof incoming["active_event_id"] === "string" ? incoming["active_event_id"] : undefined;
			yield* $(
				Effect.sync(() => {
					setCurrentCommunity({
						...currentCommunity,
						...(newActiveEventId === undefined ? {} : { active_event_id: newActiveEventId }),
					});
				}),
			);
		}
	});
}
