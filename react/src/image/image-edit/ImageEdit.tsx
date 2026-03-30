import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import ImageEditForm from "@/react/image/image-edit-form/ImageEditForm";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation } from "@/shared/user/slideOrientationPreference";

import useImageEdit from "./useImageEdit";

/**
 * Full image edit screen for dashboard routes.
 *
 * Loads the image by slug from route params, confirms the current user is the
 * owner, and renders `ImageEditForm` for edits.
 *
 * @returns React element for the image edit screen
 */
export default function ImageEdit(): ReactElement {
	const { handleDeleteConfirm, image, isImageLoading, isOwner } = useImageEdit();
	const { effectiveSlideOrientation } = useSlideOrientationPreference();
	const previewAspectClassName =
		effectiveSlideOrientation === ResolvedSlideOrientation.portrait
			? "aspect-[9/16]"
			: "aspect-video";

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

	const imageUrl = getImagePublicUrl(image.r2_key);
	const imageAlt = image.alt_text === "" ? image.image_name : image.alt_text;

	return (
		<div className="mx-auto max-w-2xl px-4 py-6 pb-32">
			<div className="mb-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold text-white">Edit Image</h1>
					<p className="text-gray-400">
						Update the name, alt text, description, and tags for this image.
					</p>
				</div>
			</div>

			<div
				className={`mb-6 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 ${previewAspectClassName}`}
			>
				<img
					src={imageUrl}
					alt={imageAlt}
					className="h-full w-full object-contain"
				/>
			</div>

			<ImageEditForm image={image} {...(isOwner ? { onDelete: handleDeleteConfirm } : {})} />
		</div>
	);
}
