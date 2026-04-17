// src/features/song-form/types.ts
import type { SongKey } from "@/shared/song/songKeyOptions";

import type { SongFormValuesFromSchema as SongFormData } from "./songSchema";

export type Slide = Readonly<{
	slide_name: string;
	field_data: Readonly<Record<string, string>>;
	background_image_id?: string | undefined;
	background_image_url?: string | undefined;
	background_image_width?: number | undefined;
	background_image_height?: number | undefined;
	background_image_focal_point_x?: number | undefined;
	background_image_focal_point_y?: number | undefined;
}>;

export type SongFormValues = {
	song_name: string;
	song_slug: string;
	lyrics: string;
	script: string | undefined;
	translations: readonly string[];
	key: SongKey | "";
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
	slideOrder: readonly string[];
	tags: readonly string[];
	slides: Record<string, Slide>;
};

export type UseSongFormReturn = {
	getFieldError: GetFieldError;
	isSubmitting: boolean;
	isLoadingData: boolean;
	submitError: string | undefined;
	slideOrder: readonly string[];
	slides: Record<string, Slide>;
	fields: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;

	handleFormSubmit: (formElement: HTMLFormElement | null) => Promise<void>;
	formRef: React.RefObject<HTMLFormElement | null>;
	resetForm: () => void;

	// Form field refs
	songNameRef: React.RefObject<HTMLInputElement | null>;
	songSlugRef: React.RefObject<HTMLInputElement | null>;

	// Controlled form field values
	formValues: SongFormValues;
	setFormValue: <Field extends keyof SongFormValues>(
		field: Field,
		value: SongFormValues[Field],
	) => void;

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
	handleDelete: () => Promise<void>;
	hasChanges: boolean;

	// Tag state
	tags: readonly string[];
	setTags: (tags: readonly string[]) => void;

	// Editing state
	isEditing: boolean;

	// Chord picker state
	pendingChordPickerRequest: SongFormChordPickerRequest | undefined;
	openChordPicker: (request: SongFormChordPickerRequest) => void;
	closeChordPicker: () => void;
	insertChordFromPicker: (token: string) => void;
};

export type SongFormChordPickerRequest = Readonly<{
	submitChord: (token: string) => void;
	initialChordToken?: string;
	isEditingChord?: boolean;
}>;

export type OpenChordPicker = (request: SongFormChordPickerRequest) => void;
