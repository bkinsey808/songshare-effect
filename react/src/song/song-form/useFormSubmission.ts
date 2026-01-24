import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { apiSongsSavePath } from "@/shared/paths";

import { type Slide } from "./songTypes";

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
	readonly hasUnsavedChanges: () => boolean;
};

type UseFormSubmissionReturn = {
	onSubmit: (data: Readonly<SongFormData>) => Promise<void>;
	handleCancel: () => void;
};

export default function useFormSubmission({
	handleApiResponseEffect,
	resetFormState,
	hasUnsavedChanges,
}: UseFormSubmissionOptions): UseFormSubmissionReturn {
	const navigate = useNavigate();
	const { t } = useTranslation();

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
				resetFormState();
				void navigate("/songs");
			}
		} catch (error) {
			console.error("❌ Network error in onSubmit:", error);
		}
	}

	// Handle cancel button click
	function handleCancel(): void {
		// Check if there are unsaved changes
		if (hasUnsavedChanges()) {
			// Show confirmation dialog
			const message = t(
				"song.cancel.confirmMessage",
				"You have unsaved changes. Are you sure you want to leave?",
			);
			// eslint-disable-next-line no-alert -- Using native confirm for unsaved changes warning
			const confirmed = globalThis.confirm(message);
			if (!confirmed) {
				// User cancelled, don't navigate
				return;
			}
		}
		// Navigate back to previous page
		const NAVIGATE_BACK = -1;
		void navigate(NAVIGATE_BACK);
	}

	return {
		onSubmit,
		handleCancel,
	};
}
