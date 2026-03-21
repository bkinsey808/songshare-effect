import ImageLibraryCard from "@/react/image-library/card/ImageLibraryCard";
import { ZERO } from "@/shared/constants/shared-constants";

import useTagView from "./useTagView";

/**
 * Displays images tagged with the slug from the current route.
 *
 * @returns A React element showing the tagged images grid.
 */
export default function TagView(): ReactElement {
	const { currentUserId, entries, error, isLoading, tag_slug } = useTagView();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="flex items-center space-x-2 text-gray-400">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
					<span>Loading...</span>
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
			<div className="py-12 text-center text-gray-400">
				No images tagged with &ldquo;{tag_slug}&rdquo;.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{entries.map((entry) => (
				<ImageLibraryCard
					key={entry.image_id}
					entry={entry}
					{...(currentUserId !== undefined && currentUserId !== ""
						? { currentUserId }
						: {})}
				/>
			))}
		</div>
	);
}
