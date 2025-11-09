import { Effect } from "effect";
import { useNavigate } from "react-router-dom";

import type { Slide } from "./songTypes";

type SongFormData = {
	song_id?: string | undefined;
	song_name: string;
	song_slug: string;
	short_credit?: string | undefined;
	long_credit?: string | undefined;
	private_notes?: string | undefined;
	public_notes?: string | undefined;
	fields: string[];
	slide_order: string[];
	slides: Record<string, Slide>;
};

type UseFormSubmissionOptions = {
	readonly handleApiResponseEffect: (
		response: Response,
		onError: () => void,
	) => Effect.Effect<boolean, never, never>;
	readonly resetFormState: () => void;
};

type UseFormSubmissionReturn = {
	onSubmit: (data: Readonly<SongFormData>) => Promise<void>;
	handleCancel: () => void;
};

export function useFormSubmission({
	handleApiResponseEffect,
	resetFormState,
}: UseFormSubmissionOptions): UseFormSubmissionReturn {
	const navigate = useNavigate();

	const onSubmit = async (rawData: Readonly<SongFormData>): Promise<void> => {
		try {
			const response = await fetch("/api/songs/save", {
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
	};

	// Handle cancel button click
	const handleCancel = (): void => {
		void navigate("..");
	};

	return {
		onSubmit,
		handleCancel,
	};
}
