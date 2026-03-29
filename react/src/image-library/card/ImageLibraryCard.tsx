import { useState } from "react";
import { Link } from "react-router-dom";

import type { ImageLibraryEntry } from "../image-library-types";
import useImageLibraryCard from "./useImageLibraryCard";

type ImageLibraryCardProps = {
	entry: ImageLibraryEntry;
	currentUserId?: string;
};

/**
 * Renders a single image library entry card.
 *
 * Shows the image thumbnail and title.
 * Displays:
 * - Delete + inline confirmation for owned images
 * - Remove for non-owned images
 * - View/Edit links when available
 *
 * @param entry - The image library entry to display
 * @param currentUserId - The ID of the currently authenticated user
 * @returns A React element displaying the image card
 */
export default function ImageLibraryCard({
	entry,
	currentUserId,
}: ImageLibraryCardProps): ReactElement {
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const { editUrl, handleDelete, handleRemove, image, imageUrl, isOwner, viewUrl } =
		useImageLibraryCard(entry, currentUserId);

	function handleDeleteClick(): void {
		setIsConfirmingDelete(true);
	}

	function handleDeleteCancel(): void {
		setIsConfirmingDelete(false);
	}

	function handleDeleteConfirm(): void {
		void handleDelete();
		setIsConfirmingDelete(false);
	}

	return (
		<div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800 transition-colors hover:border-gray-600">
			{imageUrl !== undefined && (
				<div className="aspect-video w-full overflow-hidden bg-gray-900">
					<img
						src={imageUrl}
						alt={image?.alt_text ?? image?.image_name ?? "Image"}
						className="h-full w-full object-cover"
					/>
				</div>
			)}
			<div className="p-4">
				<h3 className="mb-1 truncate font-semibold text-white">
					{image?.image_name ?? "Untitled Image"}
				</h3>
				{image?.description !== undefined && image.description !== "" && (
					<p className="mb-3 line-clamp-2 text-sm text-gray-400">{image.description}</p>
				)}
				<div className="flex items-center justify-between gap-2">
					{viewUrl !== undefined && (
						<Link
							to={viewUrl}
							className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
						>
							View
						</Link>
					)}
					{editUrl !== undefined && (
						<Link to={editUrl} className="text-sm text-gray-400 hover:text-white hover:underline">
							Edit
						</Link>
					)}
					{!isOwner && (
						<button
							type="button"
							onClick={() => {
								void handleRemove();
							}}
							className="text-sm text-red-400 hover:text-red-300"
						>
							Remove
						</button>
					)}
					{isOwner && !isConfirmingDelete && (
						<button
							type="button"
							onClick={handleDeleteClick}
							className="text-sm text-red-400 hover:text-red-300"
						>
							Delete
						</button>
					)}
					{isOwner && isConfirmingDelete && (
						<div className="flex items-center gap-1">
							<span className="text-xs text-red-300">Confirm?</span>
							<button
								type="button"
								onClick={handleDeleteCancel}
								className="text-xs text-gray-400 hover:text-white"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteConfirm}
								className="text-xs text-red-400 hover:text-red-300"
							>
								Delete
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
