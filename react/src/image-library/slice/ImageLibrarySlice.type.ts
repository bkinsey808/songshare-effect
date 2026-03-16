import type { Effect } from "effect";

import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type {
	AddImageToLibraryRequest,
	ImageLibraryEntry,
	ImageLibrarySliceBase,
	ImageLibraryState,
	RemoveImageFromLibraryRequest,
} from "../image-library-types";

export type ImageLibrarySlice = ImageLibraryState &
	ImageLibrarySliceBase & {
		addImageToLibrary: (request: Readonly<AddImageToLibraryRequest>) => Effect.Effect<void, Error>;
		removeImageFromLibrary: (
			request: Readonly<RemoveImageFromLibraryRequest>,
		) => Effect.Effect<void, Error>;
		getImageLibraryIds: () => string[];
		fetchImageLibrary: () => Effect.Effect<void, Error>;
		subscribeToImageLibrary: () => Effect.Effect<() => void, Error>;
		imageLibraryUnsubscribe?: () => void;
		setImageLibraryEntries: (entries: ReadonlyDeep<Record<string, ImageLibraryEntry>>) => void;
		setImageLibraryLoading: (loading: boolean) => void;
		setImageLibraryError: (error: string | undefined) => void;
		addImageLibraryEntry: (entry: ImageLibraryEntry) => void;
		removeImageLibraryEntry: (imageId: string) => void;
	};
