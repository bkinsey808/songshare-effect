import { Effect } from "effect";
import { useNavigate } from "react-router-dom";

import { apiSongsSavePath } from "@/shared/paths";
import { isRecord } from "@/shared/utils/typeGuards";

import { type Slide } from "../../song-form-types";

const NAVIGATE_BACK = -1;

/**
 * Parse response JSON and call onSaveSuccess with `data` when present.
 * Extracted to avoid React Compiler's "value blocks in try/catch" limitation.
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

type SongFormData = {
	song_id?: string | undefined;
	song_name: string;
	song_slug: string;
	short_credit?: string | undefined;
	long_credit?: string | undefined;
	private_notes?: string | undefined;
	public_notes?: string | undefined;
	fields: readonly string[];
	slide_order: readonly string[];
	slides: Record<string, Slide>;
};

type UseFormSubmissionOptions = {
	readonly handleApiResponseEffect: (
		response: Response,
		onError: () => void,
	) => Effect.Effect<boolean>;
	readonly resetFormState: () => void;
	/** Called with the API response body’s `data` when save succeeds. Use to update the store immediately. */
	readonly onSaveSuccess?: (data: unknown) => void;
};

type UseFormSubmissionReturn = {
	onSubmit: (data: Readonly<SongFormData>) => Promise<void>;
	handleCancel: () => void;
};

export default function useFormSubmission({
	handleApiResponseEffect,
	resetFormState,
	onSaveSuccess,
}: UseFormSubmissionOptions): UseFormSubmissionReturn {
	const navigate = useNavigate();

	async function onSubmit(rawData: Readonly<SongFormData>): Promise<void> {
		try {
			const response = await fetch(apiSongsSavePath, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(rawData),
				credentials: "include",
			});

			const isSuccess = await Effect.runPromise(
				handleApiResponseEffect(response, () => {
					// API error handler
				}),
			);

			if (isSuccess) {
				await parseSaveResponseAndNotify(response, onSaveSuccess);
				resetFormState();
				void navigate(NAVIGATE_BACK);
			}
		} catch (error) {
			console.error("❌ Network error in onSubmit:", error);
		}
	}

	// Handle cancel: just navigate. Footer shows confirmation when there are unsaved changes.
	function handleCancel(): void {
		void navigate(NAVIGATE_BACK);
	}

	return {
		onSubmit,
		handleCancel,
	};
}
