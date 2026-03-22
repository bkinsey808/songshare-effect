import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { ImageTagRow } from "@/react/tag-library/image/ImageTagRow.type";

import toImageLibraryEntry from "./toImageLibraryEntry";

function nullImagePublicRow(imageId: string): ImageTagRow {
	return forceCast<ImageTagRow>({ image_id: imageId, image_public: JSON.parse("null") as unknown });
}

const baseImagePublic = {
	image_id: "img-1",
	user_id: "user-1",
	image_name: "Test Image",
	image_slug: "test-image",
	description: "A test image",
	alt_text: "Alt text",
	r2_key: "r2/test-image",
	content_type: "image/jpeg",
	file_size: 1024,
	width: 800,
	height: 600,
	created_at: "2025-01-01T00:00:00Z",
	updated_at: "2025-01-02T00:00:00Z",
};

describe("toImageLibraryEntry", () => {
	it("maps row with image_public to ImageLibraryEntry", () => {
		const row = { image_id: "img-1", image_public: baseImagePublic };
		const result = toImageLibraryEntry(row);
		expect(result).toStrictEqual({
			user_id: "user-1",
			image_id: "img-1",
			created_at: "2025-01-01T00:00:00Z",
			image_public: baseImagePublic,
		});
	});

	it("maps row with null image_public, using empty strings for owner and created_at", () => {
		const row = nullImagePublicRow("img-2");
		const result = toImageLibraryEntry(row);
		expect(result).toStrictEqual({
			user_id: "",
			image_id: "img-2",
			created_at: "",
		});
		expect(result.image_public).toBeUndefined();
	});

	it("does not set image_public on entry when image_public is null", () => {
		const row = nullImagePublicRow("img-3");
		const result = toImageLibraryEntry(row);
		expect("image_public" in result).toBe(false);
	});

	it("sets image_public on entry when image_public is present", () => {
		const row = { image_id: "img-4", image_public: baseImagePublic };
		const result = toImageLibraryEntry(row);
		expect(result.image_public).toBe(baseImagePublic);
	});
});
