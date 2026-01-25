// src/features/song-form/types.ts
import type { SongFormValuesFromSchema as SongFormData } from "./songSchema";

export type Slide = Readonly<{
	slide_name: string;
	field_data: Readonly<Record<string, string>>;
}>;

export type SongFormValues = {
	song_name: string;
	song_slug: string;
	short_credit: string;
	long_credit: string;
	public_notes: string;
	private_notes: string;
};

export type GetFieldError = (
	field: keyof SongFormData,
) => { field: string; message: string; params?: Record<string, unknown> } | undefined;

export type FormState = {
	formValues: SongFormValues;
	fields: readonly string[];
	slideOrder: readonly string[];
	slides: Record<string, Slide>;
};

export type UseSongFormReturn = {
	getFieldError: GetFieldError;
	isSubmitting: boolean;
	isLoadingData: boolean;
	slideOrder: readonly string[];
	slides: Record<string, Slide>;
	fields: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	toggleField: (field: string, checked: boolean) => void;

	handleFormSubmit: (formElement: HTMLFormElement | null) => Promise<void>;
	formRef: React.RefObject<HTMLFormElement | null>;
	resetForm: () => void;

	// Form field refs
	songNameRef: React.RefObject<HTMLInputElement | null>;
	songSlugRef: React.RefObject<HTMLInputElement | null>;

	// Controlled form field values
	formValues: SongFormValues;
	setFormValue: (field: keyof SongFormValues, value: string) => void;

	// Collapsible section state
	isFormFieldsExpanded: boolean;
	setIsFormFieldsExpanded: (expanded: boolean) => void;
	isSlidesExpanded: boolean;
	setIsSlidesExpanded: (expanded: boolean) => void;
	isGridExpanded: boolean;
	setIsGridExpanded: (expanded: boolean) => void;

	// Handlers
	handleSongNameBlur: () => void;
	handleSave: () => void;
	handleCancel: () => void;
	hasUnsavedChanges: () => boolean;
};
