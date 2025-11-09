// src/features/song-form/SongForm.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import CollapsibleSection from "./CollapsibleSection";
import SongFormFields from "./SongFormFields";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import useSongForm from "./useSongForm";

type SongFormProps = Readonly<{
	onGetFormRef?: (formRef: React.RefObject<HTMLFormElement | null>) => void;
	onGetFormSubmit?: (
		handleFormSubmit: (event: React.FormEvent) => Promise<void>,
	) => void;
	onGetSubmissionState?: (isSubmitting: boolean) => void;
	onGetResetForm?: (resetForm: () => void) => void;
}>;

export function SongForm({
	onGetFormRef,
	onGetFormSubmit,
	onGetSubmissionState,
	onGetResetForm,
}: SongFormProps): ReactElement {
	const songId = useParams<{ song_id?: string }>().song_id;

	// Use only ONE instance of useSongForm
	const {
		getFieldError,
		isSubmitting,
		slideOrder,
		slides,
		fields,
		slug,
		setSlideOrder,
		setSlides,
		toggleField,
		handleFormSubmit,
		formRef,
		resetForm,
	} = useSongForm();

	// Expose form data to parent component using useEffect to avoid accessing refs during render
	useEffect(() => {
		if (onGetFormRef) {
			onGetFormRef(formRef);
		}
	}, [onGetFormRef, formRef]);

	useEffect(() => {
		if (onGetFormSubmit) {
			onGetFormSubmit(handleFormSubmit);
		}
	}, [onGetFormSubmit, handleFormSubmit]);

	useEffect(() => {
		if (onGetSubmissionState) {
			onGetSubmissionState(isSubmitting);
		}
	}, [onGetSubmissionState, isSubmitting]);

	useEffect(() => {
		if (onGetResetForm) {
			onGetResetForm(resetForm);
		}
	}, [onGetResetForm, resetForm]);

	// Create refs for form fields
	const songNameRef = useRef<HTMLInputElement>(null);
	const songSlugRef = useRef<HTMLInputElement>(null);

	// Local state for collapsible sections
	const [isSlidesExpanded, setIsSlidesExpanded] = useState(true);
	const [isGridExpanded, setIsGridExpanded] = useState(true);

	const handleSongNameBlur = (): void => {
		const name = songNameRef.current?.value?.trim();
		if ((name?.length ?? 0) > 0 && (slug?.length ?? 0) === 0) {
			// Simple slugify: lowercase, replace spaces with dashes, remove non-alphanumeric except dashes
			const generatedSlug = (name ?? "")
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-/, "")
				.replace(/-$/, "");

			if (songSlugRef.current) {
				songSlugRef.current.value = generatedSlug;
			}
		}
	};

	return (
		<div className="w-full">
			<h1>{(songId?.length ?? 0) > 0 ? "Edit" : "Create"} Song Form</h1>

			<form
				ref={formRef}
				className="flex w-full flex-col gap-4"
				onSubmit={handleFormSubmit}
			>
				{/* Row 1: Song Form Fields (left) + Slides Editor (right) on desktop, stacked on mobile */}
				<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
					{/* Left Column - Song Form Fields */}
					<div className="lg:flex-1">
						<SongFormFields
							getFieldError={getFieldError}
							fields={fields}
							toggleField={toggleField}
							onSongNameBlur={handleSongNameBlur}
						/>
					</div>

					{/* Right Column - Slides Editor */}
					<div className="lg:flex-1">
						<CollapsibleSection
							title="Slides Editor"
							icon="📄"
							isExpanded={isSlidesExpanded}
							onToggle={() => setIsSlidesExpanded(!isSlidesExpanded)}
						>
							<SlidesEditor
								fields={fields}
								slideOrder={slideOrder}
								setSlideOrder={setSlideOrder}
								slides={slides}
								setSlides={setSlides}
							/>
						</CollapsibleSection>
					</div>
				</div>

				{/* Row 2: Grid View spanning full width */}
				<div className="w-full">
					<CollapsibleSection
						title="Grid View"
						icon="📊"
						isExpanded={isGridExpanded}
						onToggle={() => setIsGridExpanded(!isGridExpanded)}
					>
						<SlidesGridView
							fields={fields}
							slideOrder={slideOrder}
							setSlideOrder={setSlideOrder}
							slides={slides}
							setSlides={setSlides}
						/>
					</CollapsibleSection>
				</div>
			</form>
		</div>
	);
}
