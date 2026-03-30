import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useFormChanges from "@/react/lib/form/useFormChanges";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { imageViewPath } from "@/shared/paths";

import type { ImagePublic } from "../image-types";

type ImageEditFormState = {
	altText: string;
	description: string;
	focalPointX: number;
	focalPointY: number;
	imageName: string;
	tags: readonly string[];
};

type UseImageEditFormOptions = Readonly<{
	isTagsReady?: boolean;
	setTags?: (tags: readonly string[]) => void;
	tags?: readonly string[];
}>;

export type UseImageEditFormReturn = {
	altText: string;
	description: string;
	handleReset: () => void;
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	handleCancel: () => void;
	hasChanges: boolean;
	imageName: string;
	isSubmitting: boolean;
	focalPointX: number;
	focalPointY: number;
	saveError: string | undefined;
	setAltText: (value: string) => void;
	setDescription: (value: string) => void;
	setFocalPointX: (value: number) => void;
	setFocalPointY: (value: number) => void;
	setImageName: (value: string) => void;
};

export default function useImageEditForm(
	image: ImagePublic,
	options: UseImageEditFormOptions = {},
): UseImageEditFormReturn {
	const { lang } = useLocale();
	const navigate = useNavigate();
	const { isTagsReady = true, setTags, tags = [] } = options;

	const [imageName, setImageName] = useState(image.image_name);
	const [description, setDescription] = useState(image.description);
	const [altText, setAltText] = useState(image.alt_text);
	const [focalPointX, setFocalPointX] = useState(image.focal_point_x);
	const [focalPointY, setFocalPointY] = useState(image.focal_point_y);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [saveError, setSaveError] = useState<string | undefined>(undefined);
	const hasSyncedInitialStateRef = useRef(false);

	const updateImage = useAppStore((state) => state.updateImage);
	const currentState: ImageEditFormState = {
		altText,
		description,
		focalPointX,
		focalPointY,
		imageName,
		tags,
	};
	const { getInitialState, hasUnsavedChanges, setInitialState } = useFormChanges<ImageEditFormState>({
		currentState,
		enabled: isTagsReady,
	});

	// Capture the loaded image state once so later edits can be compared and reset accurately.
	useEffect(() => {
		if (isTagsReady && !hasSyncedInitialStateRef.current) {
			setInitialState({
				altText,
				description,
				focalPointX,
				focalPointY,
				imageName,
				tags,
			});
			hasSyncedInitialStateRef.current = true;
		}
	}, [altText, description, focalPointX, focalPointY, imageName, isTagsReady, setInitialState, tags]);

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
					focal_point_x: focalPointX,
					focal_point_y: focalPointY,
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

	function handleReset(): void {
		const initialState = getInitialState();
		if (initialState === undefined) {
			return;
		}

		setImageName(initialState.imageName);
		setDescription(initialState.description);
		setAltText(initialState.altText);
		setFocalPointX(initialState.focalPointX);
		setFocalPointY(initialState.focalPointY);
		setTags?.(initialState.tags);
	}

	return {
		altText,
		description,
		handleCancel,
		handleReset,
		handleSubmit,
		hasChanges: hasUnsavedChanges(),
		imageName,
		isSubmitting,
		focalPointX,
		focalPointY,
		saveError,
		setAltText,
		setDescription,
		setFocalPointX,
		setFocalPointY,
		setImageName,
	};
}
