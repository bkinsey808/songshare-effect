import type { Effect } from "effect";

import type { ImagePublic } from "../image-types";

export type ImageState = {
	publicImages: Record<string, ImagePublic>;
	isImageLoading: boolean;
	imageError: string | undefined;
};

export type ImageSlice = ImageState & {
	fetchImageBySlug: (slug: string) => Effect.Effect<void, Error>;
	uploadImage: (formData: FormData) => Effect.Effect<ImagePublic, Error>;
	updateImage: (imageId: string, patch: ImageUpdatePatch) => Effect.Effect<ImagePublic, Error>;
	deleteImage: (imageId: string) => Effect.Effect<void, Error>;
	setPublicImage: (image: ImagePublic) => void;
	removePublicImage: (imageId: string) => void;
	setImageLoading: (loading: boolean) => void;
	setImageError: (error: string | undefined) => void;
};

export type ImageUpdatePatch = {
	image_name: string;
	description: string;
	alt_text: string;
	focal_point_x: number;
	focal_point_y: number;
	tags?: readonly string[];
};
