import ImageUploadForm from "@/react/image/image-upload-form/ImageUploadForm";

/**
 * Page for uploading a new image.
 *
 * @returns A React element that renders the `ImageUploadForm` component.
 */
export default function ImageUploadPage(): ReactElement {
	return (
		<div className="mx-auto max-w-2xl px-4 py-6">
			<div className="mb-8">
				<h1 className="mb-2 text-3xl font-bold text-white">Upload Image</h1>
				<p className="text-gray-400">Upload an image to store it in the cloud and share it.</p>
			</div>

			<ImageUploadForm />
		</div>
	);
}
