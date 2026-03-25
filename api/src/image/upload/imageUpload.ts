import { createClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";

import {
	type AuthenticationError,
	DatabaseError,
	FileUploadError,
	ValidationError,
} from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getStorageAdapter from "@/api/storage/getStorageAdapter";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";
import { tagSlugSchema } from "@/shared/validation/tagSchemas";

import buildImageSlug from "./buildImageSlug";

/** Bytes per kilobyte */
const BYTES_PER_KB = 1024;
/** Bytes per megabyte */
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
/** Max image file size in megabytes */
const MAX_IMAGE_SIZE_MB = 10;
/** Max image file size: 10 MB */
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * BYTES_PER_MB;

/** Length of the short ID suffix derived from the image UUID. */
const SHORT_ID_LENGTH = 8;
/** Start index for string slice operations. */
const SLICE_START = 0;

/** Allowed MIME types for image upload */
const ALLOWED_CONTENT_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/svg+xml",
]);

type ImageRow = {
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

/**
 * Server-side handler for uploading an image file.
 *
 * Accepts a multipart/form-data POST with the following fields:
 * - `file` (File) — the image binary
 * - `image_name` (string) — human-readable title
 * - `description` (string, optional) — longer description
 * - `alt_text` (string, optional) — accessibility alt text
 *
 * Flow:
 * 1. Authenticate the user
 * 2. Parse and validate the multipart body
 * 3. Upload the file via the configured StorageAdapter
 * 4. Create `image` (private) and `image_public` records in Supabase
 * 5. Return the public image metadata
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns The created `image_public` row, or fails with a typed error.
 */
export default function imageUpload(
	ctx: ReadonlyContext,
): Effect.Effect<
	ImageRow,
	ValidationError | DatabaseError | FileUploadError | AuthenticationError
> {
	return Effect.gen(function* imageUploadGen($) {
		// 1. Authenticate user
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// 2. Parse multipart body
		const formData = yield* $(
			Effect.tryPromise({
				try: () => ctx.req.formData(),
				catch: () => new ValidationError({ message: "Expected multipart/form-data body" }),
			}),
		);

		// FormData.get() is typed as string|null in @cloudflare/workers-types, but
		// multipart file uploads arrive as File objects at runtime.
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @cloudflare/workers-types types FormData.get() as string|null; file uploads are File at runtime
		const file = formData.get("file") as unknown as File | null;
		const imageName = formData.get("image_name");
		const description = formData.get("description") ?? "";
		const altText = formData.get("alt_text") ?? "";
		const tagsRaw = formData.get("tags");
		const tagSlugs: string[] = (() => {
			if (typeof tagsRaw !== "string" || tagsRaw === "") {
				return [];
			}
			try {
				const parsed: unknown = JSON.parse(tagsRaw);
				if (!Array.isArray(parsed)) {
					return [];
				}
				return parsed.filter(
					(val): val is string => typeof val === "string" && Schema.is(tagSlugSchema)(val),
				);
			} catch {
				return [];
			}
		})();

		if (file === null) {
			return yield* $(Effect.fail(new ValidationError({ message: "Field 'file' must be a file" })));
		}

		if (typeof imageName !== "string" || imageName.trim() === "") {
			return yield* $(
				Effect.fail(new ValidationError({ message: "Field 'image_name' is required" })),
			);
		}

		if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: `File type '${file.type}' is not allowed. Allowed types: ${[...ALLOWED_CONTENT_TYPES].join(", ")}`,
					}),
				),
			);
		}

		if (file.size > MAX_IMAGE_SIZE) {
			return yield* $(
				Effect.fail(
					new ValidationError({
						message: `File size ${file.size} exceeds limit of ${MAX_IMAGE_SIZE} bytes (10 MB)`,
					}),
				),
			);
		}

		// 3. Generate IDs and storage key
		// Note: the DB column is named "r2_key" for historical reasons;
		// it stores the storage path regardless of which backend is active.
		const imageId = crypto.randomUUID();
		const shortId = imageId.slice(SLICE_START, SHORT_ID_LENGTH);
		const imageSlug = buildImageSlug(imageName, shortId);
		const ext = file.name.includes(".") ? `.${file.name.split(".").pop() ?? "bin"}` : "";
		const storageKey = `images/${userId}/${imageId}${ext}`;

		// 4. Upload via storage adapter (Supabase Storage or R2)
		const storage = getStorageAdapter(ctx.env);

		const fileBuffer = yield* $(
			Effect.tryPromise({
				try: () => file.arrayBuffer(),
				catch: (error) =>
					new FileUploadError({ message: extractErrorMessage(error, "Failed to read file") }),
			}),
		);

		yield* $(
			Effect.tryPromise({
				try: () =>
					storage.upload(storageKey, fileBuffer, {
						contentType: file.type,
						metadata: { imageId, userId },
					}),
				catch: (error) =>
					new FileUploadError({ message: extractErrorMessage(error, "Failed to upload image") }),
			}),
		);

		// 5. Create Supabase records using service key (bypasses RLS)
		const supabase = createClient<Database>(
			ctx.env.VITE_SUPABASE_URL,
			ctx.env.SUPABASE_SERVICE_KEY,
		);

		// Insert private image record
		const privateInsert = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("image")
						.insert([{ image_id: imageId, user_id: userId, private_notes: "" }])
						.select()
						.single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to create image record"),
					}),
			}),
		);

		if (privateInsert.error) {
			// Best-effort cleanup: remove from storage if DB insert failed
			void storage.remove(storageKey);
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(privateInsert.error, "Failed to create image record"),
					}),
				),
			);
		}

		// Insert public image record
		const publicInsert = yield* $(
			Effect.tryPromise({
				try: () =>
					supabase
						.from("image_public")
						.insert([
							{
								image_id: imageId,
								user_id: userId,
								image_name: imageName.trim(),
								image_slug: imageSlug,
								description: typeof description === "string" ? description : "",
								alt_text: typeof altText === "string" ? altText : "",
								r2_key: storageKey,
								content_type: file.type,
								file_size: file.size,
							},
						])
						.select()
						.single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to create image_public record"),
					}),
			}),
		);

		if (publicInsert.error || publicInsert.data === null) {
			// Best-effort cleanup
			void storage.remove(storageKey);
			void supabase.from("image").delete().eq("image_id", imageId);
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(
							publicInsert.error ?? {},
							"Failed to create image_public record",
						),
					}),
				),
			);
		}

		const EMPTY_COUNT = 0;

		// 6. Save tags (best-effort: don't fail the upload if tag saving fails)
		if (tagSlugs.length > EMPTY_COUNT) {
			yield* $(
				Effect.tryPromise({
					try: async () => {
						await supabase.from("tag").upsert(
							tagSlugs.map((slug) => ({ tag_slug: slug })),
							{ onConflict: "tag_slug", ignoreDuplicates: true },
						);
						await supabase.from("image_tag").upsert(
							tagSlugs.map((slug) => ({ image_id: imageId, tag_slug: slug })),
							{ onConflict: "image_id,tag_slug", ignoreDuplicates: true },
						);
						await supabase.from("tag_library").upsert(
							tagSlugs.map((slug) => ({ user_id: userId, tag_slug: slug })),
							{ onConflict: "user_id,tag_slug", ignoreDuplicates: true },
						);
					},
					catch: () => new DatabaseError({ message: "Failed to save tags" }),
				}).pipe(Effect.orElse(() => Effect.void)),
			);
		}

		return publicInsert.data as ImageRow;
	});
}
