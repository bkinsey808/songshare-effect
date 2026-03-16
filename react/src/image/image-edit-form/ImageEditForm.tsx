import { Effect } from "effect";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { imageViewPath } from "@/shared/paths";

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
	const { lang } = useLocale();
	const navigate = useNavigate();

	const [imageName, setImageName] = useState(image.image_name);
	const [description, setDescription] = useState(image.description);
	const [altText, setAltText] = useState(image.alt_text);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [saveError, setSaveError] = useState<string | undefined>(undefined);

	const updateImage = useAppStore((state) => state.updateImage);

	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();

		setIsSubmitting(true);
		setSaveError(undefined);

		try {
			await Effect.runPromise(
				updateImage(image.image_id, {
					image_name: imageName,
					description,
					alt_text: altText,
				}),
			);
			setIsSubmitting(false);
			await navigate(buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang));
		} catch (error: unknown) {
			setSaveError(error instanceof Error ? error.message : "Save failed. Please try again.");
			setIsSubmitting(false);
		}
	}

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
					onChange={(event) => { setImageName(event.target.value); }}
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
					onChange={(event) => { setAltText(event.target.value); }}
					placeholder="Brief description for screen readers"
					className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			{/* Description */}
			<div>
				<label
					htmlFor="image-description"
					className="mb-2 block text-sm font-medium text-gray-300"
				>
					Description
				</label>
				<textarea
					id="image-description"
					value={description}
					onChange={(event) => { setDescription(event.target.value); }}
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
					onClick={() => {
						void navigate(buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang));
					}}
					className="rounded-lg border border-gray-600 px-6 py-2 text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
