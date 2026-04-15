import { Effect } from "effect";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageEditPath, imageViewPath } from "@/shared/paths";

import type { ImageLibraryEntry, RemoveImageFromLibraryRequest } from "../image-library-types";

export type UseImageLibraryCardReturn = {
	editUrl: string | undefined;
	handleDelete: () => Promise<void>;
	handleRemove: () => Promise<void>;
	image: ImageLibraryEntry["image_public"];
	imageUrl: string | undefined;
	isOwner: boolean;
	viewUrl: string | undefined;
};

/**
 * Hook providing behavior and URLs for an image library card.
 *
 * @param entry - The image library entry to render
 * @param currentUserId - Current signed-in user id, if any
 * @returns Handlers and derived URLs for the card UI
 */
export default function useImageLibraryCard(
	entry: ImageLibraryEntry,
	currentUserId: string | undefined,
): UseImageLibraryCardReturn {
	const { lang } = useLocale();
	const removeImageFromLibrary = useAppStore<
		(request: Readonly<RemoveImageFromLibraryRequest>) => Effect.Effect<void, Error>
	>((state: AppSlice) => state.removeImageFromLibrary);
	const deleteImage = useAppStore<(imageId: string) => Effect.Effect<void, Error>>(
		(state: AppSlice) => state.deleteImage,
	);

	const image = entry.image_public;
	const isOwner = currentUserId !== undefined && currentUserId === entry.image_public?.user_id;
	const imageUrl = image === undefined ? undefined : getImagePublicUrl(image.r2_key);
	const viewUrl =
		image === undefined
			? undefined
			: buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang);
	const editUrl =
		isOwner && image !== undefined
			? buildPathWithLang(`/${dashboardPath}/${imageEditPath}/${image.image_slug}`, lang)
			: undefined;

	/**
	 * Remove this image from the user's library via the app store effect.
	 *
	 * @returns Promise that resolves when the remove effect completes.
	 */
	async function handleRemove(): Promise<void> {
		try {
			await Effect.runPromise(removeImageFromLibrary({ image_id: entry.image_id }));
		} catch (error: unknown) {
			console.error("[ImageLibraryCard] Failed to remove image:", error);
		}
	}

	/**
	 * Delete the image owned by the current user via the app store effect.
	 *
	 * @returns Promise that resolves when the delete effect completes.
	 */
	async function handleDelete(): Promise<void> {
		try {
			await Effect.runPromise(deleteImage(entry.image_id));
		} catch (error: unknown) {
			console.error("[ImageLibraryCard] Failed to delete image:", error);
		}
	}

	return {
		editUrl,
		handleDelete,
		handleRemove,
		image,
		imageUrl,
		isOwner,
		viewUrl,
	};
}
