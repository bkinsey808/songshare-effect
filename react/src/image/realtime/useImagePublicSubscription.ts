import { Effect } from "effect";
import { useEffect } from "react";

import { getTypedState } from "@/react/app-store/useAppStore";

import subscribeToImagePublicEffect from "./subscribeToImagePublicEffect";

/**
 * Keep a single loaded image row synced via Supabase realtime.
 *
 * @param imageId - Image id to subscribe to.
 * @returns Nothing.
 */
export default function useImagePublicSubscription(imageId: string | undefined): void {
	// Keep the currently-open image fresh when another session edits or deletes it.
	useEffect(() => {
		if (imageId === undefined || imageId === "") {
			return;
		}

		let cleanup: (() => void) | undefined = undefined;

		void (async (): Promise<void> => {
			try {
				cleanup = await Effect.runPromise(
					subscribeToImagePublicEffect({
						imageIds: [imageId],
						onUpsert: (image) => {
							getTypedState().setPublicImage(image);
						},
						onDelete: (deletedImageId) => {
							getTypedState().removePublicImage(deletedImageId);
						},
					}),
				);
			} catch (error: unknown) {
				console.error("[useImagePublicSubscription] Failed to subscribe:", error);
			}
		})();

		return (): void => {
			cleanup?.();
		};
	}, [imageId]);
}
