import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { SongForm } from "@/react/song/song-form/SongForm";
import { SongFormFooter } from "@/react/song/song-form/SongFormFooter";

function SongEditPage(): ReactElement {
	const { t } = useTranslation();
	const { song_id } = useParams<{ song_id?: string }>();
	const navigate = useNavigate();

	// State to manage form submission
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [handleFormSubmit, setHandleFormSubmit] = useState<
		((event: React.FormEvent) => Promise<void>) | undefined
	>(undefined);
	const [resetFormFn, setResetFormFn] = useState<(() => void) | undefined>(
		undefined,
	);
	const formRef = useRef<HTMLFormElement>(null);

	const isEditing = Boolean(song_id?.trim()?.length);

	// Handle form callbacks from SongForm
	const handleGetFormRef = (
		ref: React.RefObject<HTMLFormElement | null>,
	): void => {
		formRef.current = ref.current;
	};

	const handleGetFormSubmit = (
		submitFn: (event: React.FormEvent) => Promise<void>,
	): void => {
		setHandleFormSubmit(() => submitFn);
	};

	const handleGetSubmissionState = (submitting: boolean): void => {
		setIsSubmitting(submitting);
	};

	const handleGetResetForm = (resetFn: () => void): void => {
		setResetFormFn(() => resetFn);
	};

	// Handle footer save button click
	const handleSave = async (): Promise<void> => {
		if (handleFormSubmit && formRef.current) {
			// Create a synthetic form event
			const syntheticEvent = new Event("submit", {
				bubbles: true,
				cancelable: true,
			}) as unknown as React.FormEvent;
			await handleFormSubmit(syntheticEvent);
		}
	};

	// Handle reset button click
	const handleReset = (): void => {
		if (resetFormFn) {
			resetFormFn();
		}
	};

	// Handle cancel button click
	const handleCancel = (): void => {
		void navigate("..");
	};

	return (
		<>
			<div className="w-full">
				<div className="mb-6">
					<h1 className="mb-2 text-3xl font-bold">
						{isEditing
							? t("pages.songEdit.editTitle", "Edit Song")
							: t("pages.songEdit.createTitle", "Create New Song")}
					</h1>
					<p className="text-gray-400">
						{isEditing
							? t(
									"pages.songEdit.editDescription",
									"Make changes to your song and save when ready.",
								)
							: t(
									"pages.songEdit.createDescription",
									"Create a new song with lyrics, slides, and metadata.",
								)}
					</p>
				</div>

				<div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
					<SongForm
						onGetFormRef={handleGetFormRef}
						onGetFormSubmit={handleGetFormSubmit}
						onGetSubmissionState={handleGetSubmissionState}
						onGetResetForm={handleGetResetForm}
					/>
				</div>
			</div>

			<SongFormFooter
				isSubmitting={isSubmitting}
				isEditing={isEditing}
				onSave={handleSave}
				onReset={handleReset}
				onCancel={handleCancel}
			/>
		</>
	);
}

export default SongEditPage;
