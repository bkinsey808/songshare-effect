import { useEffect, useState } from "react";

import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import fetchItemTagsRequest from "@/react/tag-library/fetchItemTagsRequest";
import TagList from "@/react/tag-library/TagList";

import ImageViewLibraryAction from "./ImageViewLibraryAction";
import useImageView from "./useImageView";

const BYTES_PER_KB = 1024;
const ONE_DECIMAL = 1;

/**
 * Public view for a single image, loaded by slug from the URL.
 *
 * Handles loading/error/not-found states, shows the image from R2,
 * and renders Share + Library action buttons.
 *
 * @returns React element for the image view page
 */
export default function ImageView(): ReactElement {
	const {
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
	} = useImageView();
	const [tags, setTags] = useState<string[]>([]);

	// Load the image's tags for display.
	useEffect(() => {
		if (image === undefined) { return; }
		void (async (): Promise<void> => {
			setTags(await fetchItemTagsRequest("image", image.image_id));
		})();
	}, [image]);

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

	if (typeof imageError === "string" && imageError !== "") {
		return (
			<div className="mx-auto max-w-4xl px-4 py-6">
				<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
					<p className="text-red-400">{imageError}</p>
				</div>
			</div>
		);
	}

	if (image === undefined) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-6">
				<div className="py-12 text-center">
					<div className="mb-4 text-6xl">🖼️</div>
					<h2 className="mb-2 text-xl font-semibold text-white">Image not found</h2>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-6">
			<div className="mb-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="mb-2 text-3xl font-bold text-white">{image.image_name}</h1>
					</div>
					<div className="flex items-center gap-3">
						{isOwner && (
							<button
								type="button"
								onClick={handleEditClick}
								className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
							>
								Edit
							</button>
						)}
						{isOwner && !isConfirmingDelete && (
							<button
								type="button"
								onClick={handleDeleteClick}
								data-testid="image-view-delete"
								className="rounded-lg border border-red-600/50 bg-red-900/20 px-4 py-2 text-sm text-red-400 transition-colors hover:border-red-500 hover:bg-red-900/40 hover:text-red-300"
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
						{!isOwner && (
							<ImageViewLibraryAction imageId={image.image_id} imageOwnerId={image.user_id} />
						)}
						<ShareButton itemType="image" itemId={image.image_id} itemName={image.image_name} />
					</div>
				</div>

				<div className="mt-4">
					<CollapsibleQrCode url={qrCodeUrl ?? ""} label="Image QR Code" />
				</div>
			</div>

			{/* Image display */}
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
				{imageUrl === undefined ? (
					<div className="flex items-center justify-center py-12 text-gray-500">
						Image unavailable
					</div>
				) : (
					<img
						src={imageUrl}
						alt={image.alt_text === "" ? image.image_name : image.alt_text}
						className="w-full object-contain"
						style={
							image.height !== null && image.width !== null
								? { aspectRatio: `${image.width}/${image.height}` }
								: undefined
						}
					/>
				)}
			</div>

			{/* Metadata */}
			{image.description !== "" && (
				<div className="mb-6">
					<p className="text-gray-300">{image.description}</p>
				</div>
			)}

			<div className="mb-6 text-sm text-gray-500">
				<span>
					{image.content_type} &middot; {(image.file_size / BYTES_PER_KB).toFixed(ONE_DECIMAL)} KB
				</span>
				{image.width !== null && image.height !== null && (
					<span>
						{" "}
						&middot; {image.width}&times;{image.height}px
					</span>
				)}
			</div>

			<TagList slugs={tags} />

			{/* Shared users */}
			<SharedUsersSection itemId={image.image_id} itemType="image" itemName={image.image_name} />
		</div>
	);
}
