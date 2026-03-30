/**
 * Core types for the image feature.
 *
 * Mirrors the `image_public` table columns returned by the API.
 */

export type ImageFocalPoint = {
	focal_point_x: number;
	focal_point_y: number;
};

export type ImagePublic = ImageFocalPoint & {
	image_id: string;
	user_id: string;
	image_name: string;
	image_slug: string;
	description: string;
	alt_text: string;
	r2_key: string;
	content_type: string;
	file_size: number;
	width: number | null;
	height: number | null;
	created_at: string;
	updated_at: string;
};
