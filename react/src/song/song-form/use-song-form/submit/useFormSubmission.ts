import { Effect } from "effect";
import { useNavigate } from "react-router-dom";

import type { SongFormValuesFromSchema as SongFormData } from "@/react/song/song-form/songSchema";
import { apiSongsSavePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";

const NAVIGATE_BACK = -1;
const DEFAULT_SUBMIT_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Parse response JSON and call `onSaveSuccess` with `data` when present.
 * Extracted to avoid React Compiler's "value blocks in try/catch" limitation.
 *
 * @param response - Fetch API Response object to parse
 * @param onSaveSuccess - Optional callback invoked with parsed `data` when present
 * @returns Promise<void>
 */
async function parseSaveResponseAndNotify(
	response: Response,
	onSaveSuccess: ((data: unknown) => void) | undefined,
): Promise<void> {
	try {
		const raw: unknown = await response.json();
		if (
			isRecord(raw) &&
			"data" in raw &&
			raw["data"] !== undefined &&
			onSaveSuccess !== undefined
		) {
			onSaveSuccess(raw["data"]);
		}
	} catch {
		// Non-fatal: store will still receive data via subscribe/refetch
	}
}

type UseFormSubmissionOptions = {
	readonly handleApiResponseEffect: (
		response: Response,
		onError: (message: string) => void,
	) => Effect.Effect<boolean>;
	readonly resetFormState: () => void;
	/** Called with the API response body’s `data` when save succeeds. Use to update the store immediately. */
	readonly onSaveSuccess?: (data: unknown) => void;
	/** Called when a submit-level error should be surfaced to the user. */
	readonly setSubmitError?: (message: string) => void;
	/** Clears any previously visible submit-level error before a new attempt or after success. */
	readonly clearSubmitError?: () => void;
};

type UseFormSubmissionReturn = {
	onSubmit: (data: Readonly<SongFormData>) => Promise<void>;
	handleCancel: () => void;
};

/**
 * Hook to handle song form submission: posts form data to the API and
 * delegates API response handling to the provided effect handler.
 *
 * @param handleApiResponseEffect - Effect-based response handler for API errors
 * @param resetFormState - Resets form state after successful save
 * @param onSaveSuccess - Optional callback invoked with API response `data` on success
 * @param setSubmitError - Optional callback used to surface submit-level errors in the UI
 * @param clearSubmitError - Optional callback used to clear a previous submit-level error
 * @returns Object with `onSubmit` and `handleCancel` handlers
 */
export default function useFormSubmission({
	handleApiResponseEffect,
	resetFormState,
	onSaveSuccess,
	setSubmitError,
	clearSubmitError,
}: UseFormSubmissionOptions): UseFormSubmissionReturn {
	const navigate = useNavigate();

	/**
	 * Clear any visible submit-level error if the caller provided a handler.
	 *
	 * @returns void
	 */
	function clearVisibleSubmitError(): void {
		if (clearSubmitError !== undefined) {
			clearSubmitError();
		}
	}

	/**
	 * Surface a submit-level error if the caller provided a handler.
	 *
	 * @param message - User-facing error message to display
	 * @returns void
	 */
	function setVisibleSubmitError(message: string): void {
		if (setSubmitError !== undefined) {
			setSubmitError(message);
		}
	}

	/**
	 * Submit form data to the API and run the provided API response effect handler.
	 *
	 * @param rawData - Final form payload to POST to the API
	 * @returns Promise<void>
	 */
	async function onSubmit(rawData: Readonly<SongFormData>): Promise<void> {
		clearVisibleSubmitError();

		try {
			const response = await fetch(apiSongsSavePath, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(rawData),
				credentials: "include",
			});

			const isSuccess = await Effect.runPromise(
				handleApiResponseEffect(response, (message) => {
					setVisibleSubmitError(message);
				}),
			);

			if (isSuccess) {
				clearVisibleSubmitError();
				await parseSaveResponseAndNotify(response, onSaveSuccess);
				resetFormState();
				void navigate(NAVIGATE_BACK);
			}
		} catch (error) {
			setVisibleSubmitError(DEFAULT_SUBMIT_ERROR_MESSAGE);
			console.error("❌ Network error in onSubmit:", error);
		}
	}

	/**
	 * Navigate back to the previous screen without saving.
	 *
	 * @returns void
	 */
	function handleCancel(): void {
		void navigate(NAVIGATE_BACK);
	}

	return {
		onSubmit,
		handleCancel,
	};
}
