import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import subscribeToCommunityEvent from "@/react/community/subscribe/subscribeToCommunityEvent";
import subscribeToCommunityPublic from "@/react/community/subscribe/subscribeToCommunityPublic";

/**
 * Manages realtime Supabase subscriptions for the community manage view.
 * Subscribes to `community_event` and `community_public` tables filtered
 * by the given community id, and tears down the subscriptions on cleanup.
 *
 * @param communityId - id of the community to subscribe to; subscriptions
 *   are skipped when undefined
 * @returns void
 */
export default function useCommunityManageSubscriptions(communityId: string | undefined): void {
	// Subscribe to realtime community_event changes filtered by community
	useEffect(() => {
		if (communityId === undefined) {
			// oxlint-disable-next-line no-empty-function -- no subscription when undefined; return fn for React 19 HMR
			return;
		}
		let cleanup: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				cleanup = await Effect.runPromise(
					subscribeToCommunityEvent(communityId, useAppStore.getState),
				);
			} catch (error: unknown) {
				console.error("[useCommunityManageSubscriptions] subscribeToCommunityEvent error:", error);
			}
		})();
		return (): void => {
			cleanup?.();
		};
	}, [communityId]);

	// Subscribe to realtime community_public changes (tracks active_event_id)
	useEffect(() => {
		if (communityId === undefined) {
			// oxlint-disable-next-line no-empty-function -- no subscription when undefined; return fn for React 19 HMR
			return;
		}
		let cleanup: (() => void) | undefined = undefined;
		void (async (): Promise<void> => {
			try {
				cleanup = await Effect.runPromise(
					subscribeToCommunityPublic(communityId, useAppStore.getState),
				);
			} catch (error: unknown) {
				console.error("[useCommunityManageSubscriptions] subscribeToCommunityPublic error:", error);
			}
		})();
		return (): void => {
			cleanup?.();
		};
	}, [communityId]);
}
