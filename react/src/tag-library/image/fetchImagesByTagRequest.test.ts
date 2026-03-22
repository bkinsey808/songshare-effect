import { describe, expect, it, vi } from "vitest";

import type { ImagePublic } from "@/react/image/image-types";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchImagesByTagRequest from "./fetchImagesByTagRequest";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockClient = forceCast<ReturnType<typeof getSupabaseClient>>({});

const mockImagePublic: ImagePublic = {
	image_id: "img-1",
	user_id: "user-1",
	image_name: "Test Image",
	image_slug: "test-image",
	description: "desc",
	alt_text: "alt",
	r2_key: "key",
	content_type: "image/jpeg",
	file_size: 1000,
	width: 800,
	height: 600,
	created_at: "2024-01-01",
	updated_at: "2024-01-01",
};

describe("fetchImagesByTagRequest", () => {
	it("returns empty entries when client is undefined", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(undefined);

		const result = await fetchImagesByTagRequest("my-tag");

		expect(result).toStrictEqual({ ok: true, entries: [] });
		expect(callSelect).not.toHaveBeenCalled();
	});

	it("returns mapped entries on success", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
		// Step 1: image_tag returns the image ID
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({ data: [{ image_id: "img-1" }], error: JSON.parse("null") as unknown }),
		);
		// Step 2: image_library returns the full entry for that image ID
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({
				data: [
					{
						user_id: "user-1",
						image_id: "img-1",
						created_at: "2024-01-01",
						image_public: mockImagePublic,
					},
				],
				error: JSON.parse("null") as unknown,
			}),
		);

		const result = await fetchImagesByTagRequest("my-tag");

		expect(result).toStrictEqual({
			ok: true,
			entries: [
				{
					user_id: "user-1",
					image_id: "img-1",
					created_at: "2024-01-01",
					image_public: mockImagePublic,
				},
			],
		});
	});

	it("skips rows that fail isImageTagRow", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
		// Step 1: image_tag returns the image ID
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({ data: [{ image_id: "img-1" }], error: JSON.parse("null") as unknown }),
		);
		// Step 2: image_library returns one valid row and one invalid row
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({
				data: [
					{ user_id: "", image_id: "img-1", created_at: "" },
					{ not_an_image_row: true },
				],
				error: JSON.parse("null") as unknown,
			}),
		);

		const result = await fetchImagesByTagRequest("my-tag");

		expect(result).toStrictEqual({
			ok: true,
			entries: [
				{
					user_id: "",
					image_id: "img-1",
					created_at: "",
				},
			],
		});
	});

	it("returns error when callSelect returns a non-null error", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
		vi.mocked(callSelect).mockResolvedValueOnce(
			forceCast({ data: [], error: { message: "db error" } }),
		);

		const result = await fetchImagesByTagRequest("my-tag");

		expect(result).toStrictEqual({
			ok: false,
			error: "Failed to load images for this tag.",
		});
	});

	it("returns error when callSelect throws", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValueOnce(undefined);
		vi.mocked(getSupabaseClient).mockReturnValueOnce(mockClient);
		vi.mocked(callSelect).mockRejectedValueOnce(new Error("network error"));

		const result = await fetchImagesByTagRequest("my-tag");

		expect(result).toStrictEqual({
			ok: false,
			error: "Failed to load images for this tag.",
		});
	});
});
