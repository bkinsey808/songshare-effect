export type NormalizedSlide = Readonly<{
	slide_name: string;
	field_data: Record<string, string>;
	background_image_id?: string | undefined;
	background_image_url?: string | undefined;
	background_image_width?: number | undefined;
	background_image_height?: number | undefined;
	background_image_focal_point_x?: number | undefined;
	background_image_focal_point_y?: number | undefined;
}>;
