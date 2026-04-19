import { useState } from "react";

import generateSlug from "@/react/lib/slug/generateSlug";
import type { SongFormValues } from "@/react/song/song-form/song-form-types";

import createEmptySongFormValues from "../createEmptySongFormValues";
import setFieldValue from "../setFieldValue";

type UseSongFormValuesParams = {
	readonly formRef: React.RefObject<HTMLFormElement | null>;
};

type UseSongFormValuesReturn = {
	formValues: SongFormValues;
	setFormValuesState: React.Dispatch<React.SetStateAction<SongFormValues>>;
	setFormValue: <Field extends keyof SongFormValues>(
		field: Field,
		value: SongFormValues[Field],
	) => void;
	handleSongNameBlur: () => void;
	resetFormValues: () => SongFormValues;
};

/**
 * Hook that manages controlled Song form field values and their derived helpers.
 *
 * @param formRef - Ref to the backing DOM form used for FormData submission
 * @returns Controlled values plus mutation helpers for the Song form fields
 */
export default function useSongFormValues({
	formRef,
}: UseSongFormValuesParams): UseSongFormValuesReturn {
	const [formValues, setFormValuesState] = useState<SongFormValues>(createEmptySongFormValues);

	/**
	 * Update a single controlled form value and mirror it on the underlying DOM form element.
	 *
	 * @param field - The form field key to update
	 * @param value - New value for the field
	 * @returns void
	 */
	function setFormValue<Field extends keyof SongFormValues>(
		field: Field,
		value: SongFormValues[Field],
	): void {
		setFormValuesState((previousValues) => ({ ...previousValues, [field]: value }));
		// React will update the DOM automatically via the value prop.
		// We also write through to the form element so FormData sees the latest value.
		if (formRef.current && (typeof value === "string" || value === undefined)) {
			setFieldValue(formRef.current, field, value);
		}
	}

	/**
	 * When the song name loses focus, generate and set a slug if none exists.
	 *
	 * @returns void
	 */
	function handleSongNameBlur(): void {
		const name = formValues.song_name.trim();
		const currentSlug = formValues.song_slug.trim();
		if (name !== "" && currentSlug === "") {
			setFormValue("song_slug", generateSlug(name));
		}
	}

	/**
	 * Reset controlled field values back to their empty defaults.
	 *
	 * @returns The empty value object that was applied
	 */
	function resetFormValues(): SongFormValues {
		const emptyFormValues = createEmptySongFormValues();
		setFormValuesState(emptyFormValues);
		return emptyFormValues;
	}

	return {
		formValues,
		setFormValuesState,
		setFormValue,
		handleSongNameBlur,
		resetFormValues,
	};
}
