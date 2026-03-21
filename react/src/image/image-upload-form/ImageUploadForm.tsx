import useImageUploadForm from "@/react/image/image-upload-form/useImageUploadForm";
import TagInput from "@/react/tag/input/TagInput";

/**
 * Form for uploading a new image to Cloudflare R2.
 *
 * Sends a multipart request to the image upload API and navigates to the
 * image view page on success.
 *
 * @returns React element rendering the image upload form
 */
export default function ImageUploadForm(): ReactElement {
	const {
		altText,
		description,
		fileInputRef,
		handleCancel,
		handleFileChange,
		handleSubmit,
		imageName,
		isSubmitting,
		previewUrl,
		selectedFile,
		setAltText,
		setDescription,
		setImageName,
		tags,
		setTags,
		uploadError,
	} = useImageUploadForm();

	return (
		<form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
			{/* File picker */}
			<div>
				<label htmlFor="image-file" className="mb-2 block text-sm font-medium text-gray-300">
					Image File <span className="text-red-400">*</span>
				</label>
				<input
					id="image-file"
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/gif,.gif,image/webp,.webp,image/avif,.avif,image/svg+xml,.svg"
					onChange={handleFileChange}
					required
					className="block w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-700 text-sm text-gray-400 file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-blue-600 file:py-2 file:pl-3 file:pr-4 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
				/>
				{previewUrl !== undefined && (
					<div className="mt-3">
						<img
							src={previewUrl}
							alt="Preview"
							className="max-h-48 rounded-lg border border-gray-700 object-contain"
						/>
					</div>
				)}
			</div>

			{/* Image name */}
			<div>
				<label htmlFor="image-name" className="mb-2 block text-sm font-medium text-gray-300">
					Image Name
				</label>
				<input
					id="image-name"
					type="text"
					value={imageName}
					onChange={(event) => {
						setImageName(event.target.value);
					}}
					placeholder="My Image"
					className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			{/* Alt text */}
			<div>
				<label htmlFor="image-alt" className="mb-2 block text-sm font-medium text-gray-300">
					Alt Text
				</label>
				<input
					id="image-alt"
					type="text"
					value={altText}
					onChange={(event) => {
						setAltText(event.target.value);
					}}
					placeholder="Brief description for screen readers"
					className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			{/* Description */}
			<div>
				<label htmlFor="image-description" className="mb-2 block text-sm font-medium text-gray-300">
					Description
				</label>
				<textarea
					id="image-description"
					value={description}
					onChange={(event) => {
						setDescription(event.target.value);
					}}
					rows={3}
					placeholder="Optional description"
					className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			{/* Tags */}
			<div>
				<p className="mb-2 text-sm font-medium text-gray-300">Tags</p>
				<TagInput value={tags} onChange={setTags} />
			</div>

			{uploadError !== undefined && (
				<div className="rounded-lg border border-red-600 bg-red-900/20 p-3">
					<p className="text-sm text-red-400">{uploadError}</p>
				</div>
			)}

			<div className="flex gap-3">
				<button
					type="submit"
					disabled={isSubmitting || selectedFile === undefined}
					className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? "Uploading..." : "Upload Image"}
				</button>
				<button
					type="button"
					onClick={handleCancel}
					className="rounded-lg border border-gray-600 px-6 py-2 text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
