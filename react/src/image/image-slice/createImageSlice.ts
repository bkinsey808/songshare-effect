import { Effect } from "effect";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiImageDeletePath, apiImageUpdatePath, apiImageUploadPath } from "@/shared/paths";

import guardAsImagePublic from "../guards/guardAsImagePublic";
import type { ImagePublic } from "../image-types";
import type { ImageSlice, ImageState, ImageUpdatePatch } from "./ImageSlice.type";

/** Index used to access the first element of a single-row query result array. */
const FIRST_ROW = 0;

const initialState: ImageState = {
	publicImages: {} as Record<string, ImagePublic>,
	isImageLoading: false,
	imageError: undefined,
};

/**
 * Factory that creates the Zustand slice for image state and actions.
 *
 * @param set - Zustand `set` function for updating slice state.
 * @param get - Zustand `get` function for reading slice state.
 * @param api - Optional api helpers (currently unused).
 * @returns - The fully constructed `ImageSlice`.
 */
export default function createImageSlice(
	set: Set<ImageSlice>,
	get: Get<ImageSlice>,
	api: Api<ImageSlice>,
): ImageSlice {
	void api;
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,

		fetchImageBySlug: (slug: string): Effect.Effect<void, Error> =>
			Effect.gen(function* fetchBySlugGen($) {
				const { setImageLoading, setImageError, setPublicImage } = get();

				yield* $(
					Effect.sync(() => {
						setImageLoading(true);
						setImageError(undefined);
					}),
				);

				const userToken = yield* $(
					Effect.tryPromise({
						try: () => Promise.resolve(getSupabaseAuthToken()),
						catch: (error) => new Error(String(error)),
					}),
				);

				const queryClient = getSupabaseClient(userToken);
				if (queryClient === undefined) {
					yield* $(
						Effect.sync(() => {
							setImageLoading(false);
						}),
					);
					return yield* $(Effect.fail(new Error("No Supabase client available")));
				}

				const { data: imageRows, error: imageError } = yield* $(
					Effect.tryPromise({
						try: () =>
							callSelect<ImagePublic>(queryClient, "image_public", {
								eq: { col: "image_slug", val: slug },
								single: true,
							}),
						catch: (error) => new Error(String(error)),
					}),
				);
				yield* $(
					Effect.sync(() => {
						setImageLoading(false);
					}),
				);

				if (imageError !== null && imageError !== undefined) {
					return yield* $(Effect.fail(new Error("Image not found")));
				}

				// callSelect with single:true returns data as array at the type level
				// but the runtime value is the single row; handle both shapes
				const singleImage: ImagePublic | undefined = Array.isArray(imageRows)
					? imageRows[FIRST_ROW]
					: ((imageRows as ImagePublic | null | undefined) ?? undefined);

				if (singleImage === undefined) {
					return yield* $(Effect.fail(new Error("Image not found")));
				}

				yield* $(
					Effect.sync(() => {
						setPublicImage(singleImage);
					}),
				);
			}),

		uploadImage: (formData: FormData): Effect.Effect<ImagePublic, Error> =>
			Effect.gen(function* uploadGen($) {
				const { setImageError } = get();

				yield* $(
					Effect.sync(() => {
						setImageError(undefined);
					}),
				);

				const response = yield* $(
					Effect.tryPromise({
						try: () =>
							fetch(apiImageUploadPath, {
								method: "POST",
								body: formData,
							}),
						catch: (error) => new Error(extractErrorMessage(error, "Network error")),
					}),
				);

				const json: unknown = yield* $(
					Effect.tryPromise({
						try: () => response.json() as Promise<unknown>,
						catch: () => new Error("Invalid JSON response"),
					}),
				);

				if (!response.ok) {
					const errMsg = extractErrorMessage(json, `Upload failed (${response.status})`);
					return yield* $(Effect.fail(new Error(errMsg)));
				}

				let responseData: unknown = json;
				if (typeof json === "object" && json !== null && "data" in json) {
					const { data: innerData } = json as Record<string, unknown>;
					responseData = innerData;
				}

				const imageData = yield* $(
					Effect.try({
						try: () => guardAsImagePublic(responseData, "upload response"),
						catch: (error) => new Error(extractErrorMessage(error, "Invalid server response")),
					}),
				);

				const { setPublicImage } = get();
				yield* $(
					Effect.sync(() => {
						setPublicImage(imageData);
					}),
				);

				return imageData;
			}),

		updateImage: (imageId: string, patch: ImageUpdatePatch): Effect.Effect<ImagePublic, Error> =>
			Effect.gen(function* updateImageGen($) {
				const { setImageError, setPublicImage } = get();

				yield* $(
					Effect.sync(() => {
						setImageError(undefined);
					}),
				);

				const response = yield* $(
					Effect.tryPromise({
						try: () =>
							fetch(apiImageUpdatePath, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ image_id: imageId, ...patch }),
							}),
						catch: (error) => new Error(extractErrorMessage(error, "Network error")),
					}),
				);

				const json: unknown = yield* $(
					Effect.tryPromise({
						try: () => response.json() as Promise<unknown>,
						catch: () => new Error("Invalid JSON response"),
					}),
				);

				if (!response.ok) {
					const errMsg = extractErrorMessage(json, `Update failed (${response.status})`);
					return yield* $(Effect.fail(new Error(errMsg)));
				}

				let responseData: unknown = json;
				if (typeof json === "object" && json !== null && "data" in json) {
					const { data: innerData } = json as Record<string, unknown>;
					responseData = innerData;
				}

				const imageData = yield* $(
					Effect.try({
						try: () => guardAsImagePublic(responseData, "update response"),
						catch: (error) => new Error(extractErrorMessage(error, "Invalid server response")),
					}),
				);

				yield* $(
					Effect.sync(() => {
						setPublicImage(imageData);
					}),
				);

				return imageData;
			}),

		deleteImage: (imageId: string): Effect.Effect<void, Error> =>
			Effect.gen(function* deleteGen($) {
				const { setImageError, removePublicImage } = get();

				yield* $(
					Effect.sync(() => {
						setImageError(undefined);
					}),
				);

				const response = yield* $(
					Effect.tryPromise({
						try: () =>
							fetch(apiImageDeletePath, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ image_id: imageId }),
							}),
						catch: (error) => new Error(extractErrorMessage(error, "Network error")),
					}),
				);

				const json: unknown = yield* $(
					Effect.tryPromise({
						try: () => response.json() as Promise<unknown>,
						catch: () => new Error("Invalid JSON response"),
					}),
				);

				if (!response.ok) {
					const errMsg = extractErrorMessage(json, `Delete failed (${response.status})`);
					return yield* $(Effect.fail(new Error(errMsg)));
				}

				yield* $(
					Effect.sync(() => {
						removePublicImage(imageId);
					}),
				);
			}),

		setPublicImage: (image: ImagePublic) => {
			set((state) => ({
				publicImages: { ...state.publicImages, [image.image_id]: image },
			}));
		},

		removePublicImage: (imageId: string) => {
			set((state) => {
				const next = Object.fromEntries(
					Object.entries(state.publicImages).filter(([id]) => id !== imageId),
				);
				return { publicImages: next };
			});
		},

		setImageLoading: (loading: boolean) => {
			set({ isImageLoading: loading });
		},

		setImageError: (error: string | undefined) => {
			set({ imageError: error });
		},
	};
}
