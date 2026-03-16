import { Effect } from "effect";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import ImageEditForm from "@/react/image/image-edit-form/ImageEditForm";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { imageViewPath } from "@/shared/paths";

/**
 * Dashboard page for editing an existing image's metadata.
 *
 * Loads the image by slug from the URL, confirms the current user is the
 * owner, and renders the `ImageEditForm`. Redirects to the image view page
 * if the image is not found or the user is not the owner.
 *
 * @returns React element for the image edit page
 */
export default function ImageEditPage(): ReactElement {
	const { image_id } = useParams<{ image_id: string }>();
	const { lang } = useLocale();
	const navigate = useNavigate();
	const currentUserId = useCurrentUserId();

	const publicImages = useAppStore((state) => state.publicImages);
	const isImageLoading = useAppStore((state) => state.isImageLoading);
	const fetchImageBySlug = useAppStore((state) => state.fetchImageBySlug);

	// image_id here is actually the image_slug passed via the route
	// Fetch if not already loaded
	useEffect(() => {
		if (image_id !== undefined && image_id !== "") {
			void Effect.runPromise(fetchImageBySlug(image_id));
		}
	}, [image_id, fetchImageBySlug]);

	const image =
		image_id === undefined
			? undefined
			: Object.values(publicImages).find((img) => img.image_slug === image_id);

	// Redirect non-owners back to the view page once loaded
	useEffect(() => {
		if (
			!isImageLoading &&
			image !== undefined &&
			currentUserId !== undefined &&
			image.user_id !== currentUserId
		) {
			void navigate(buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang));
		}
	}, [isImageLoading, image, currentUserId, navigate, lang]);

	if (isImageLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>Loading image...</span>
				</div>
			</div>
		);
	}

	if (image === undefined) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-6">
				<div className="py-12 text-center text-gray-400">Image not found.</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-6">
			<div className="mb-8">
				<h1 className="mb-2 text-3xl font-bold text-white">Edit Image</h1>
				<p className="text-gray-400">Update the name, alt text, or description for this image.</p>
			</div>

			<ImageEditForm image={image} />
		</div>
	);
}
