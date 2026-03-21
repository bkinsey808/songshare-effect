import TagLibrary from "@/react/tag-library/TagLibrary";

/**
 * Page that displays the user's tag library (bookmarked tags).
 *
 * @returns A React element that renders the `TagLibrary` component.
 */
export default function TagLibraryPage(): ReactElement {
	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">Tag Library</h1>
				<p className="text-lg text-gray-300">Browse your bookmarked tags</p>
			</div>

			<TagLibrary />
		</div>
	);
}
