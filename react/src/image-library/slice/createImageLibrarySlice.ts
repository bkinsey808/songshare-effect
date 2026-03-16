import type { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import fetchImageLibraryEffect from "../fetch/fetchImageLibraryEffect";
import addImageToLibraryEffect from "../image-add/addImageToLibraryEffect";
import type {
    AddImageToLibraryRequest,
    ImageLibraryEntry,
    ImageLibraryState,
    RemoveImageFromLibraryRequest,
} from "../image-library-types";
import removeImageFromLibraryEffect from "../image-remove/removeImageFromLibraryEffect";
import subscribeToImageLibraryEffect from "../subscribe/subscribeToImageLibraryEffect";
import type { ImageLibrarySlice } from "./ImageLibrarySlice.type";

const initialState: ImageLibraryState = {
	imageLibraryEntries: {} as Record<string, ImageLibraryEntry>,
	isImageLibraryLoading: false,
	imageLibraryError: undefined,
};

/**
 * Factory that creates the Zustand slice for image library state and actions.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `ImageLibrarySlice`.
 */
export default function createImageLibrarySlice(
	set: Set<ImageLibrarySlice>,
	get: Get<ImageLibrarySlice>,
	api: Api<ImageLibrarySlice>,
): ImageLibrarySlice {
	void api;
	sliceResetFns.add(() => {
		const { imageLibraryUnsubscribe } = get();
		if (imageLibraryUnsubscribe) {
			imageLibraryUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		addImageToLibrary: (request: Readonly<AddImageToLibraryRequest>) =>
			addImageToLibraryEffect(request, get),

		removeImageFromLibrary: (request: Readonly<RemoveImageFromLibraryRequest>) =>
			removeImageFromLibraryEffect(request, get),

		isInImageLibrary: (imageId: string) => {
			const { imageLibraryEntries } = get();
			return imageId in imageLibraryEntries;
		},

		getImageLibraryIds: () => {
			const { imageLibraryEntries } = get();
			return Object.keys(imageLibraryEntries);
		},

		fetchImageLibrary: () => fetchImageLibraryEffect(get),

		subscribeToImageLibrary: (): Effect.Effect<() => void, Error> =>
			subscribeToImageLibraryEffect(get),

		setImageLibraryEntries: (entries: ReadonlyDeep<Record<string, ImageLibraryEntry>>) => {
			set({ imageLibraryEntries: entries });
		},

		addImageLibraryEntry: (entry: ImageLibraryEntry) => {
			set((state) => ({
				imageLibraryEntries: {
					...state.imageLibraryEntries,
					[entry.image_id]: entry,
				},
			}));
		},

		removeImageLibraryEntry: (imageId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.imageLibraryEntries).filter(([id]) => id !== imageId),
				);
				return { imageLibraryEntries: newEntries };
			});
		},

		setImageLibraryLoading: (loading: boolean) => {
			set({ isImageLibraryLoading: loading });
		},

		setImageLibraryError: (error: string | undefined) => {
			set({ imageLibraryError: error });
		},
	};
}
