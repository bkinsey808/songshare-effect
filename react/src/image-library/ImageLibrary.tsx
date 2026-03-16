import Button from "@/react/lib/design-system/Button";
import PlusIcon from "@/react/lib/design-system/icons/PlusIcon";
import { ZERO } from "@/shared/constants/shared-constants";

import ImageLibraryCard from "./card/ImageLibraryCard";
import type { ImageLibraryEntry } from "./image-library-types";
import useImageLibraryPage from "./useImageLibraryPage";

/**
 * Main component for the image library page. Displays the current user's images
 * (owned or added to library) and allows them to manage entries.
 *
 * @returns A React element that displays loading, error, empty, or library states
 */
export default function ImageLibrary(): ReactElement {
	const { currentUserId, entries, error, handleUploadClick, isLoading } = useImageLibraryPage();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>Loading image library...</span>
				</div>
			</div>
		);
	}

	if (typeof error === "string" && error !== "") {
		return (
			<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
				<p className="text-red-400">{error}</p>
			</div>
		);
	}

	if (entries.length === ZERO) {
		return (
			<div className="py-12 text-center">
				<div className="mb-4 text-6xl">🖼️</div>
				<h2 className="mb-2 text-xl font-semibold text-white">No images yet</h2>
				<p className="mb-6 text-gray-400">
					Upload an image or add one to your library to get started.
				</p>
				<Button
					variant="outlinePrimary"
					size="compact"
					icon={<PlusIcon className="size-5" />}
					onClick={handleUploadClick}
					data-testid="image-library-upload-image"
				>
					Upload Image
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="text-xl font-semibold text-white">My Image Library</h2>
					<span className="text-sm text-gray-400">{entries.length} images</span>
				</div>
				<Button
					variant="outlinePrimary"
					size="compact"
					icon={<PlusIcon className="size-5" />}
					onClick={handleUploadClick}
					data-testid="image-library-upload-image"
				>
					Upload Image
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{entries.map((entry: ImageLibraryEntry) => (
					<ImageLibraryCard
						key={entry.image_id}
						entry={entry}
						{...(currentUserId !== undefined && currentUserId !== "" ? { currentUserId } : {})}
					/>
				))}
			</div>
		</div>
	);
}
