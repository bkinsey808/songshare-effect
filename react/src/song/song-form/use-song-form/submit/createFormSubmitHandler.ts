import { Effect } from "effect";

import type { Slide } from "@/react/song/song-form/song-form-types";

import toStringArray from "@/shared/type-guards/toStringArray";
import { safeSet } from "@/shared/utils/safe";

type CreateFormSubmitHandlerParams<FormData> = {
	readonly songId: string | undefined;
	readonly fields: readonly string[];
	readonly slideOrder: readonly string[];
	readonly slides: Record<string, Slide>;
	readonly handleSubmit: (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: Readonly<FormData>) => Promise<void> | void,
	) => Effect.Effect<void>;
	readonly onSubmit: (data: Readonly<FormData>) => Promise<void> | void;
};

/**
 * Creates a form submit handler that collects form data from both DOM and React state.
 * Handles form submission with data collection from FormData and controlled state values.
 */
export default function createFormSubmitHandler<FormData>({
	songId,
	fields,
	slideOrder,
	slides,
	handleSubmit,
	onSubmit,
}: CreateFormSubmitHandlerParams<FormData>): (
	formElement: HTMLFormElement | null,
) => Promise<void> {
	return async function handleFormSubmit(formElement: HTMLFormElement | null): Promise<void> {
		if (!formElement) {
			console.error("❌ Form element not found");
			return;
		}

		const formDataObj = new FormData(formElement);
		const currentFormData: Record<string, unknown> = {};
		for (const [key, value] of formDataObj.entries()) {
			if (typeof value === "string") {
				safeSet(currentFormData, key, value);
			} else if (value instanceof File) {
				safeSet(currentFormData, key, value.name);
			} else {
				safeSet(currentFormData, key, String(value));
			}
		}

		// Add controlled state values that aren't captured by FormData
		// Convert readonly arrays to mutable arrays expected by the schema
		// Map/convert each value to a string to avoid unsafe spread of unknown/any values
		// CRITICAL: Include song_id if editing (it's not in FormData but needed for updates)
		if (songId !== undefined && songId.trim() !== "") {
			currentFormData["song_id"] = songId;
		}
		currentFormData["fields"] = toStringArray(fields);
		currentFormData["slide_order"] = toStringArray(slideOrder);
		currentFormData["slides"] = slides;

		try {
			await Effect.runPromise(handleSubmit(currentFormData, onSubmit));
		} catch (error) {
			console.error("❌ handleSubmit failed:", error);
		}
	};
}
