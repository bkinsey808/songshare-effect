import ImageLibrary from "@/react/image-library/ImageLibrary";

/**
 * Page that displays the user's image library.
 *
 * @returns A React element that renders the `ImageLibrary` component.
 */
export default function ImageLibraryPage(): ReactElement {
	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-3xl font-bold text-white">Image Library</h1>
				<p className="text-lg text-gray-300">Browse and manage your images</p>
			</div>

			<ImageLibrary />
		</div>
	);
}
