import type { ImagePublic } from "@/react/image/image-types";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00Z";

/**
 * Build a complete `ImagePublic` fixture from a small override object.
 *
 * @param overrides - Partial field overrides for the default image row.
 * @returns A complete `ImagePublic` object.
 */
export default function makeImagePublic(overrides: Partial<ImagePublic> = {}): ImagePublic {
	return {
		image_id: "img-1",
		user_id: TEST_USER_ID,
		image_name: "My Image",
		image_slug: "my-image",
		description: "desc",
		alt_text: "alt",
		focal_point_x: 50,
		focal_point_y: 50,
		r2_key: "images/usr-1/img-1.jpg",
		content_type: "image/jpeg",
		file_size: 1024,
		width: 800,
		height: 600,
		created_at: DEFAULT_TIMESTAMP,
		updated_at: DEFAULT_TIMESTAMP,
		...overrides,
	};
}
