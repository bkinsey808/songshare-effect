import { Effect } from "effect";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useImagePublicSubscription from "@/react/image/realtime/useImagePublicSubscription";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageLibraryPath, imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

type UseImageEditReturn = {
	handleDeleteConfirm: () => void;
	image: ImagePublic | undefined;
	isImageLoading: boolean;
	isOwner: boolean;
};

/**
 * Loads and authorizes image edit state for the image-edit route.
 *
 * Fetches the image by slug from route params and redirects non-owners back to
 * the public image view once loading completes.
 *
 * @returns image and loading state for the edit screen
 */
export default function useImageEdit(): UseImageEditReturn {
	const { image_id } = useParams<{ image_id: string }>();
	const { lang } = useLocale();
	const navigate = useNavigate();
	const currentUserId = useCurrentUserId();

	const publicImages = useAppStore((state) => state.publicImages);
	const isImageLoading = useAppStore((state) => state.isImageLoading);
	const fetchImageBySlug = useAppStore((state) => state.fetchImageBySlug);
	const deleteImage = useAppStore((state) => state.deleteImage);

	// image_id here is actually the image_slug passed via the route.
	useEffect(() => {
		if (image_id !== undefined && image_id !== "") {
			void Effect.runPromise(fetchImageBySlug(image_id));
		}
	}, [image_id, fetchImageBySlug]);

	const image =
		image_id === undefined
			? undefined
			: Object.values(publicImages).find((img) => img.image_slug === image_id);
	const isOwner =
		image !== undefined && currentUserId !== undefined && image.user_id === currentUserId;

	useImagePublicSubscription(image?.image_id);

	// Redirect non-owners back to the view page once loading completes.
	useEffect(() => {
		if (!isImageLoading && image !== undefined && currentUserId !== undefined && !isOwner) {
			void navigate(buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang));
		}
	}, [isImageLoading, image, currentUserId, isOwner, navigate, lang]);

	/**
	 * Confirm deletion of the current image and navigate to the library on success.
	 *
	 * This performs a store-driven delete and awaits navigation on success.
	 *
	 * @returns void
	 */
	function handleDeleteConfirm(): void {
		if (image === undefined || !isOwner) {
			return;
		}

		const destinationPath = buildPathWithLang(`/${dashboardPath}/${imageLibraryPath}`, lang);

		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(deleteImage(image.image_id));
				await navigate(destinationPath);
			} catch {
				/* error is surfaced by the store */
			}
		})();
	}

	return {
		handleDeleteConfirm,
		image,
		isImageLoading,
		isOwner,
	};
}
