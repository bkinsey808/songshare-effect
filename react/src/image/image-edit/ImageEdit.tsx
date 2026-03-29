import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import ImageEditForm from "@/react/image/image-edit-form/ImageEditForm";

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
	const {
		handleDeleteCancel,
		handleDeleteClick,
		handleDeleteConfirm,
		image,
		isConfirmingDelete,
		isImageLoading,
		isOwner,
	} = useImageEdit();

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
		<div className="mx-auto max-w-2xl px-4 py-6">
			<div className="mb-8 flex items-start justify-between gap-4">
				<div>
					<h1 className="mb-2 text-3xl font-bold text-white">Edit Image</h1>
					<p className="text-gray-400">
						Update the name, alt text, description, and tags for this image.
					</p>
				</div>
				{isOwner && !isConfirmingDelete && (
					<button
						type="button"
						onClick={handleDeleteClick}
						data-testid="image-edit-delete"
						className="rounded-lg border border-red-600/50 bg-red-900/20 px-3 py-2 text-sm text-red-400 transition-colors hover:border-red-500 hover:bg-red-900/40 hover:text-red-300"
					>
						Delete
					</button>
				)}
				{isOwner && isConfirmingDelete && (
					<div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-1">
						<span className="px-2 text-xs font-medium text-red-200">Confirm?</span>
						<button
							type="button"
							onClick={handleDeleteCancel}
							className="rounded-md px-3 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDeleteConfirm}
							className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500"
						>
							Delete
						</button>
					</div>
				)}
			</div>

			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
				<img
					src={imageUrl}
					alt={imageAlt}
					className="w-full object-contain"
					style={
						image.height !== null && image.width !== null
							? { aspectRatio: `${image.width}/${image.height}` }
							: undefined
					}
				/>
			</div>

			<ImageEditForm image={image} />
		</div>
	);
}
