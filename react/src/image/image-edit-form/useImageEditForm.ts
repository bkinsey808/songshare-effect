import { Effect } from "effect";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

export type UseImageEditFormReturn = {
	altText: string;
	description: string;
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	handleCancel: () => void;
	imageName: string;
	isSubmitting: boolean;
	saveError: string | undefined;
	setAltText: (value: string) => void;
	setDescription: (value: string) => void;
	setImageName: (value: string) => void;
};

export default function useImageEditForm(
	image: ImagePublic,
	tags: readonly string[] = [],
): UseImageEditFormReturn {
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
					tags,
				}),
			);
			setIsSubmitting(false);
			await navigate(buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang));
		} catch (error: unknown) {
			setSaveError(error instanceof Error ? error.message : "Save failed. Please try again.");
			setIsSubmitting(false);
		}
	}

	function handleCancel(): void {
		void navigate(buildPathWithLang(`/${imageViewPath}/${image.image_slug}`, lang));
	}

	return {
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
	};
}
