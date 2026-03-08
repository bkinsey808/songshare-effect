import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import subscribeToCommunityEvent from "@/react/community/subscribe/subscribeToCommunityEvent";
import subscribeToCommunityPublic from "@/react/community/subscribe/subscribeToCommunityPublic";

/**
 * Registers realtime subscriptions needed by the public community view.
 *
 * @param communityId - current community id
 */
export default function useCommunityViewSubscriptions(communityId: string | undefined): void {
	// Subscribe to realtime community_event changes for the active community.
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
				console.error("[useCommunityView] subscribeToCommunityEvent error:", error);
			}
		})();
		return (): void => {
			cleanup?.();
		};
	}, [communityId]);

	// Subscribe to realtime community_public changes such as active_event_id.
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
				console.error("[useCommunityView] subscribeToCommunityPublic error:", error);
			}
		})();
		return (): void => {
			cleanup?.();
		};
	}, [communityId]);
}
