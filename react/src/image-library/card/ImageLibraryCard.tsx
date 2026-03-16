import { Effect } from "effect";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import getImagePublicUrl from "@/react/image/get-image-public-url";
import { imageViewPath } from "@/shared/paths";
import { Link } from "react-router-dom";

import type { ImageLibraryEntry, RemoveImageFromLibraryRequest } from "../image-library-types";

type ImageLibraryCardProps = {
	entry: ImageLibraryEntry;
	currentUserId?: string;
};

/**
 * Renders a single image library entry card.
 *
 * Shows the image thumbnail and title.
 * Displays a remove button for non-owners and a link to the image view page.
 *
 * @param entry - The image library entry to display
 * @param currentUserId - The ID of the currently authenticated user
 * @returns A React element displaying the image card
 */
export default function ImageLibraryCard({
	entry,
	currentUserId,
}: ImageLibraryCardProps): ReactElement {
	const { lang } = useLocale();
	const removeImageFromLibrary = useAppStore<
		(request: Readonly<RemoveImageFromLibraryRequest>) => Effect.Effect<void, Error>
	>((state: AppSlice) => state.removeImageFromLibrary);

	const image = entry.image_public;
	const isOwner = currentUserId !== undefined && currentUserId === entry.image_owner_id;
	const imageUrl = image === undefined ? undefined : getImagePublicUrl(image.r2_key);
	const viewUrl =
		image === undefined
			? undefined
			: buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang);

	async function handleRemove(): Promise<void> {
		try {
			await Effect.runPromise(
				removeImageFromLibrary({ image_id: entry.image_id }),
			);
		} catch (error: unknown) {
			console.error("[ImageLibraryCard] Failed to remove image:", error);
		}
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
					{!isOwner && (
						<button
							type="button"
							onClick={() => { void handleRemove(); }}
							className="text-sm text-red-400 hover:text-red-300"
						>
							Remove
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
