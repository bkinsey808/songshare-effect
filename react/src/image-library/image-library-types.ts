/**
 * Image library types.
 *
 * Type definitions used by the Image Library slice, effects, and components.
 * These mirror the `image_library` and `image_public` database columns.
 */

import type { ImagePublic } from "@/react/image/image-types";

export type ImageLibrary = {
	user_id: string;
	image_id: string;
	image_owner_id: string;
	created_at: string;
};

export type ImageLibraryEntry = ImageLibrary & {
	image_public?: ImagePublic;
};

export type AddImageToLibraryRequest = {
	image_id: string;
};

export type RemoveImageFromLibraryRequest = {
	image_id: string;
};

export type ImageLibraryState = {
	imageLibraryEntries: Record<string, ImageLibraryEntry>;
	isImageLibraryLoading: boolean;
	imageLibraryError: string | undefined;
};

export type ImageLibrarySliceBase = {
	isInImageLibrary: (imageId: string) => boolean;
};
