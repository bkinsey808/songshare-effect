import { Effect } from "effect";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageLibraryPath, imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

/**
 * Form for uploading a new image to Cloudflare R2.
 *
 * Sends a multipart request to the image upload API and navigates to the
 * image view page on success.
 *
 * @returns React element rendering the image upload form
 */
export default function ImageUploadForm(): ReactElement {
	const { lang } = useLocale();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [imageName, setImageName] = useState("");
	const [description, setDescription] = useState("");
	const [altText, setAltText] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadError, setUploadError] = useState<string | undefined>(undefined);

	const uploadImage = useAppStore((state) => state.uploadImage);

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const [file] = event.target.files ?? [];
		if (file === undefined) {
			return;
		}
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
		if (imageName === "") {
			setImageName(file.name.replace(/\.[^/.]+$/, ""));
		}
	}

	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		if (selectedFile === undefined) {
			setUploadError("Please select an image file.");
			return;
		}

		const formData = new FormData();
		formData.append("file", selectedFile);
		formData.append("image_name", imageName);
		formData.append("description", description);
		formData.append("alt_text", altText);

		setIsSubmitting(true);
		setUploadError(undefined);

		try {
			const result: ImagePublic = await Effect.runPromise(uploadImage(formData));
			setIsSubmitting(false);
			await navigate(
				buildPathWithLang(`/${imageViewPath}/${result.image_slug}`, lang),
			);
		} catch (error: unknown) {
			setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
			setIsSubmitting(false);
		}
	}

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
					accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
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
					onClick={() => {
						void navigate(buildPathWithLang(`/${dashboardPath}/${imageLibraryPath}`, lang));
					}}
					className="rounded-lg border border-gray-600 px-6 py-2 text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
