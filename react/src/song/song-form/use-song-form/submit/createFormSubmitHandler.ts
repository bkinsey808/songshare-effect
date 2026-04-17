import { Effect } from "effect";

import type { Slide } from "@/react/song/song-form/song-form-types";
import safeDelete, { safeSet } from "@/shared/utils/safe";
import toStringArray from "@/shared/utils/toStringArray";

type CreateFormSubmitHandlerParams<FormData> = {
	readonly songId: string | undefined;
	readonly lyrics: readonly string[];
	readonly script: readonly string[];
	readonly translations: readonly string[];
	readonly slideOrder: readonly string[];
	readonly slides: Record<string, Slide>;
	readonly getTags?: () => readonly string[] | undefined;
	readonly handleSubmit: (
		formData: Readonly<Record<string, unknown>>,
		onSubmit: (data: Readonly<FormData>) => Promise<void> | void,
	) => Effect.Effect<void>;
	readonly onSubmit: (data: Readonly<FormData>) => Promise<void> | void;
};

/**
 * Creates a form submit handler that collects form data from both the DOM
 * `FormData` and controlled React state, then invokes the provided
 * `handleSubmit`/`onSubmit` pipeline.
 *
 * @param songId - optional song id to include when editing
 * @param slideOrder - ordered list of slide ids
 * @param translations - Translation language codes present on the form
 * @param slides - map of slide id to `Slide` objects
 * @param getTags - optional callback returning the current tags list
 * @param handleSubmit - wrapper that executes the actual submit logic and returns an Effect
 * @param onSubmit - user-provided callback invoked with the final form data
 * @returns A function that accepts an `HTMLFormElement | null` and returns a `Promise<void>` which
 * resolves after `handleSubmit` completes (or logs an error on failure).
 */
export default function createFormSubmitHandler<FormData>({
	songId,
	lyrics,
	script,
	translations,
	slideOrder,
	slides,
	getTags,
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
		if (currentFormData["key"] === "") {
			safeDelete(currentFormData, "key");
		}

		// Add controlled state values that aren't captured by FormData
		// Convert readonly arrays to mutable arrays expected by the schema
		// Map/convert each value to a string to avoid unsafe spread of unknown/any values
		// CRITICAL: Include song_id if editing (it's not in FormData but needed for updates)
		if (songId !== undefined && songId.trim() !== "") {
			currentFormData["song_id"] = songId;
		}
		currentFormData["lyrics"] = [...lyrics];
		currentFormData["script"] = [...script];
		currentFormData["translations"] = [...translations];
		currentFormData["slide_order"] = toStringArray(slideOrder);
		currentFormData["slides"] = slides;
		const tags = getTags?.();
		if (tags !== undefined) {
			currentFormData["tags"] = [...tags];
		}

		try {
			await Effect.runPromise(handleSubmit(currentFormData, onSubmit));
		} catch (error) {
			console.error("❌ handleSubmit failed:", error);
		}
	};
}
