import { useEffect } from "react";
import { Effect } from "effect";

import { appStore } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

/**
 * Fetches sent shares and subscribes to real-time updates.
 * Call from a page component (e.g. SongView) before any conditional returns.
 */
export default function useShareSubscription(): void {
	const currentUserId = useCurrentUserId();

	// Fetch sent shares and subscribe to real-time updates when user is logged in
	useEffect(() => {
		if (typeof currentUserId !== "string") {
			return undefined;
		}

		const userId: string = currentUserId;
		const {
			fetchShares,
			subscribeToSentShares,
		} = appStore.getState();

		let sentCleanup: (() => void) | undefined = undefined;

		const FETCH_TIMEOUT_MS = 10_000;

		function createTimeoutPromise(ms: number): Promise<never> {
			// oxlint-disable-next-line promise/avoid-new
			return new Promise((_resolve, reject) => {
				setTimeout(() => {
					reject(new Error("Fetch shares timed out"));
				}, ms);
			});
		}

		async function setup(): Promise<void> {
			try {
				const fetchPromise = Effect.runPromise(fetchShares({ view: "sent" }));
				await Promise.race([
					fetchPromise,
					createTimeoutPromise(FETCH_TIMEOUT_MS),
				]);
				sentCleanup = await Effect.runPromise(
					subscribeToSentShares(userId),
				);
			} catch (error) {
				console.error("Failed to set up share subscription:", error);
				appStore.getState().setSharesLoading(false);
			}
		}

		void setup();

		return (): void => {
			sentCleanup?.();
			appStore.getState().setSharesLoading(false);
		};
	}, [currentUserId]);
}
