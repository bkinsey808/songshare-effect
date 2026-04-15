import { Effect } from "effect";
import { useEffect } from "react";

import { getTypedState } from "@/react/app-store/useAppStore";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";

import subscribeToImagePublicEffect from "./subscribeToImagePublicEffect";

const EMPTY_IMAGE_IDS = 0;

/**
 * Keep the currently loaded image-library metadata in sync with `image_public`.
 *
 * @param imageIds - Library image ids currently in view.
 * @returns Nothing.
 */
export default function useImageLibraryPublicSubscription(imageIds: readonly string[]): void {
	const imageIdsKey = imageIds.join(",");

	// Keep image library cards in sync with realtime image_public metadata changes.
	useEffect(() => {
		const currentImageIds = imageIdsKey === "" ? [] : imageIdsKey.split(",");
		if (currentImageIds.length === EMPTY_IMAGE_IDS) {
			return;
		}

		let cleanup: (() => void) | undefined = undefined;

		/**
		 * Update a single image-library entry in the global typed state.
		 *
		 * @param imageId - Image id to update.
		 * @param updater - Updater function that receives the current entry.
		 * @returns void
		 */
		function setImageLibraryEntry(
			imageId: string,
			updater: (entry: ImageLibraryEntry) => ImageLibraryEntry,
		): void {
			const state = getTypedState();
			const currentEntry = state.imageLibraryEntries[imageId];
			if (currentEntry === undefined) {
				return;
			}

			state.setImageLibraryEntries({
				...state.imageLibraryEntries,
				[imageId]: updater(currentEntry),
			});
		}

		void (async (): Promise<void> => {
			try {
				cleanup = await Effect.runPromise(
					subscribeToImagePublicEffect({
						imageIds: currentImageIds,
						onUpsert: (image) => {
							const state = getTypedState();
							state.setPublicImage(image);
							setImageLibraryEntry(image.image_id, (entry) => ({
								...entry,
								image_public: image,
							}));
						},
						onDelete: (deletedImageId) => {
							const state = getTypedState();
							state.removePublicImage(deletedImageId);
							setImageLibraryEntry(deletedImageId, (entry) => {
								const { image_public: _removedImagePublic, ...entryWithoutImagePublic } = entry;
								return entryWithoutImagePublic;
							});
						},
					}),
				);
			} catch (error: unknown) {
				console.error("[useImageLibraryPublicSubscription] Failed to subscribe:", error);
			}
		})();

		return (): void => {
			cleanup?.();
		};
	}, [imageIdsKey]);
}
