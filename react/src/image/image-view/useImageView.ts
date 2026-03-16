import { Effect } from "effect";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageEditPath, imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

export type UseImageViewReturn = {
	handleEditClick: () => void;
	image: ImagePublic | undefined;
	imageError: string | undefined;
	imageUrl: string | undefined;
	isImageLoading: boolean;
	isOwner: boolean;
	qrCodeUrl: string | undefined;
};

export default function useImageView(): UseImageViewReturn {
	const { lang } = useLocale();
	const { image_slug } = useParams<{ image_slug: string }>();
	const navigate = useNavigate();
	const currentUserId = useCurrentUserId();

	const publicImages = useAppStore((state) => state.publicImages);
	const isImageLoading = useAppStore((state) => state.isImageLoading);
	const imageError = useAppStore((state) => state.imageError);
	const fetchImageBySlug = useAppStore((state) => state.fetchImageBySlug);

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

	const isOwner =
		image !== undefined && currentUserId !== undefined && currentUserId === image.user_id;

	const imageUrl =
		image !== undefined && image.r2_key !== undefined ? getImagePublicUrl(image.r2_key) : undefined;

	const qrCodeUrl =
		image === undefined
			? undefined
			: buildPublicWebUrl(`/${imageViewPath}/${image.image_slug}`, lang);

	function handleEditClick(): void {
		if (image !== undefined) {
			void navigate(
				buildPathWithLang(`/${dashboardPath}/${imageEditPath}/${image.image_slug}`, lang),
			);
		}
	}

	return {
		handleEditClick,
		image,
		imageError,
		imageUrl,
		isImageLoading,
		isOwner,
		qrCodeUrl,
	};
}
