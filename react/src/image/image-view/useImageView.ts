import { Effect } from "effect";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import useImagePublicSubscription from "@/react/image/realtime/useImagePublicSubscription";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import useItemTagsDisplay from "@/react/tag/useItemTagsDisplay";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageEditPath, imageLibraryPath, imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

/**
 * Delete an image via the provided effect and invoke `onSuccess` when done.
 *
 * @param deleteEffect - effect that performs the delete operation
 * @param onSuccess - callback to run after successful deletion
 * @returns void
 */
async function performImageDelete(
	deleteEffect: Effect.Effect<void, Error>,
	onSuccess: () => void,
): Promise<void> {
	await Effect.runPromise(deleteEffect);
	onSuccess();
}

export type UseImageViewReturn = {
	handleDeleteCancel: () => void;
	handleDeleteClick: () => void;
	handleDeleteConfirm: () => void;
	handleEditClick: () => void;
	image: ImagePublic | undefined;
	imageError: string | undefined;
	imageUrl: string | undefined;
	isConfirmingDelete: boolean;
	isImageLoading: boolean;
	isOwner: boolean;
	qrCodeUrl: string | undefined;
	tags: string[];
};

/**
 * Hook for the image view screen: loads the image, subscribes to updates,
 * and exposes handlers for edit/delete flows.
 *
 * @returns image view state and handlers
 */
export default function useImageView(): UseImageViewReturn {
	const { lang } = useLocale();
	const { image_slug } = useParams<{ image_slug: string }>();
	const navigate = useNavigate();
	const currentUserId = useCurrentUserId();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	const publicImages = useAppStore((state) => state.publicImages);
	const isImageLoading = useAppStore((state) => state.isImageLoading);
	const imageError = useAppStore((state) => state.imageError);
	const fetchImageBySlug = useAppStore((state) => state.fetchImageBySlug);
	const deleteImage = useAppStore((state) => state.deleteImage);

	useShareSubscription();

	// Fetch the image by slug when the slug or fetch function changes
	useEffect(() => {
		if (image_slug !== undefined && image_slug !== "") {
			void Effect.runPromise(fetchImageBySlug(image_slug));
		}
	}, [image_slug, fetchImageBySlug]);

	const image =
		image_slug === undefined
			? undefined
			: Object.values(publicImages).find((img) => img.image_slug === image_slug);

	const tags = useItemTagsDisplay("image", image?.image_id);
	useImagePublicSubscription(image?.image_id);

	const isOwner =
		image !== undefined && currentUserId !== undefined && currentUserId === image.user_id;

	const imageUrl =
		image !== undefined && image.r2_key !== undefined ? getImagePublicUrl(image.r2_key) : undefined;

	const qrCodeUrl =
		image === undefined
			? undefined
			: buildPublicWebUrl(`/${imageViewPath}/${image.image_slug}`, lang);

	/**
	 * Navigate to the edit page for the current image when present.
	 *
	 * @returns void
	 */
	function handleEditClick(): void {
		if (image !== undefined) {
			void navigate(
				buildPathWithLang(`/${dashboardPath}/${imageEditPath}/${image.image_slug}`, lang),
			);
		}
	}

	/**
	 * Enter confirming delete state.
	 *
	 * @returns void
	 */
	function handleDeleteClick(): void {
		setIsConfirmingDelete(true);
	}

	/**
	 * Exit confirming delete state.
	 *
	 * @returns void
	 */
	function handleDeleteCancel(): void {
		setIsConfirmingDelete(false);
	}

	/**
	 * Confirm deletion of the current image and navigate away on success.
	 *
	 * @returns void
	 */
	function handleDeleteConfirm(): void {
		if (image === undefined) {
			return;
		}

		const destinationPath = buildPathWithLang(`/${dashboardPath}/${imageLibraryPath}`, lang);

		const deleteEffect = deleteImage(image.image_id);

		void performImageDelete(deleteEffect, () => {
			void navigate(destinationPath);
		});
	}

	return {
		handleDeleteCancel,
		handleDeleteClick,
		handleDeleteConfirm,
		handleEditClick,
		image,
		imageError,
		imageUrl,
		isConfirmingDelete,
		isImageLoading,
		isOwner,
		qrCodeUrl,
		tags,
	};
}
