import { Effect } from "effect";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageLibraryPath, imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

export type UseImageUploadFormReturn = {
	altText: string;
	description: string;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	handleCancel: () => void;
	handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	imageName: string;
	isSubmitting: boolean;
	previewUrl: string | undefined;
	selectedFile: File | undefined;
	setAltText: (value: string) => void;
	setDescription: (value: string) => void;
	setImageName: (value: string) => void;
	uploadError: string | undefined;
};

export default function useImageUploadForm(): UseImageUploadFormReturn {
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
		setImageName((prev) => (prev === "" ? file.name.replace(/\.[^/.]+$/, "") : prev));
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
			await navigate(buildPathWithLang(`/${imageViewPath}/${result.image_slug}`, lang));
		} catch (error: unknown) {
			setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
			setIsSubmitting(false);
		}
	}

	function handleCancel(): void {
		void navigate(buildPathWithLang(`/${dashboardPath}/${imageLibraryPath}`, lang));
	}

	return {
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
		uploadError,
	};
}
