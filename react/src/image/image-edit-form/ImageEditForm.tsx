import useImageEditForm from "@/react/image/image-edit-form/useImageEditForm";
import TagInput from "@/react/tag/input/TagInput";
import useItemTags from "@/react/tag/useItemTags";

import type { ImagePublic } from "../image-types";

type ImageEditFormProps = {
	image: ImagePublic;
};

/**
 * Form for editing the metadata of an existing image.
 *
 * Pre-populates name, alt text and description from the current record,
 * and navigates back to the image view page on successful save.
 *
 * @param image - The current image record to edit
 * @returns React element rendering the image edit form
 */
export default function ImageEditForm({ image }: ImageEditFormProps): ReactElement {
	const { tags, setTags } = useItemTags("image", image.image_id);
	const {
		altText,
		description,
		handleCancel,
		handleSubmit,
		imageName,
		isSubmitting,
		saveError,
		setAltText,
		setDescription,
		setImageName,
	} = useImageEditForm(image, tags);

	return (
		<form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
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

			{saveError !== undefined && (
				<div className="rounded-lg border border-red-600 bg-red-900/20 p-3">
					<p className="text-sm text-red-400">{saveError}</p>
				</div>
			)}

			{/* Tags */}
			<div>
				<p className="mb-2 text-sm font-medium text-gray-300">Tags</p>
				<TagInput value={tags} onChange={setTags} />
			</div>

			<div className="flex gap-3">
				<button
					type="submit"
					disabled={isSubmitting}
					className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? "Saving..." : "Save Changes"}
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
