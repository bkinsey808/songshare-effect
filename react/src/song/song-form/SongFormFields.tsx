import { useTranslation } from "react-i18next";

import FormField from "@/react/design-system/form/FormField";
import FormInput from "@/react/design-system/form/FormInput";
import FormSection from "@/react/design-system/form/FormSection";
import FormTextarea from "@/react/design-system/form/FormTextarea";

type SongFormFieldsProps = Readonly<{
	getFieldError: (
		fieldName: keyof {
			song_name: string;
			song_slug: string;
			short_credit?: string;
			long_credit?: string;
		},
	) => { message: string; params?: Record<string, unknown> } | undefined;
	onSongNameBlur: () => void;
	songNameRef: React.RefObject<HTMLInputElement | null>;
	songSlugRef: React.RefObject<HTMLInputElement | null>;
	formValues: {
		song_name: string;
		song_slug: string;
		short_credit: string;
		long_credit: string;
		public_notes: string;
		private_notes: string;
	};
	setFormValue: (field: keyof SongFormFieldsProps["formValues"], value: string) => void;
}>;

export default function SongFormFields({
	getFieldError,
	onSongNameBlur,
	songNameRef,
	songSlugRef,
	formValues,
	setFormValue,
}: SongFormFieldsProps): ReactElement {
	const { t } = useTranslation();

	// Extract onChange handlers to satisfy linter
	function handleSongNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("song_name", event.target.value);
	}
	function handleSongSlugChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("song_slug", event.target.value);
	}
	function handleShortCreditChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("short_credit", event.target.value);
	}
	function handleLongCreditChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("long_credit", event.target.value);
	}
	function handlePublicNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("public_notes", event.target.value);
	}
	function handlePrivateNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("private_notes", event.target.value);
	}

	return (
		<FormSection>
			<FormField
				label={t("song.songName", "Song Name")}
				error={(() => {
					const songNameError = getFieldError("song_name");
					return songNameError
						? t(songNameError.message, {
								...songNameError.params,
								defaultValue: songNameError.message,
							})
						: undefined;
				})()}
			>
				<FormInput
					ref={songNameRef}
					name="song_name"
					value={formValues.song_name}
					onChange={handleSongNameChange}
					onBlur={onSongNameBlur}
				/>
			</FormField>

			<FormField
				label={t("song.songSlug", "Song Slug")}
				error={(() => {
					const songSlugError = getFieldError("song_slug");
					return songSlugError
						? t(songSlugError.message, {
								...songSlugError.params,
								defaultValue: songSlugError.message,
							})
						: undefined;
				})()}
			>
				<FormInput
					ref={songSlugRef}
					name="song_slug"
					value={formValues.song_slug}
					onChange={handleSongSlugChange}
				/>
			</FormField>

			<FormField
				label={t("song.shortCredit", "Short Credit")}
				error={(() => {
					const shortCreditError = getFieldError("short_credit");
					return shortCreditError
						? t(shortCreditError.message, {
								...shortCreditError.params,
								defaultValue: shortCreditError.message,
							})
						: undefined;
				})()}
			>
				<FormInput
					name="short_credit"
					value={formValues.short_credit}
					onChange={handleShortCreditChange}
				/>
			</FormField>

			<FormField label={t("song.longCredit", "Long Credit")}>
				<FormTextarea
					name="long_credit"
					value={formValues.long_credit}
					onChange={handleLongCreditChange}
					placeholder="Enter long credit..."
					autoExpand
				/>
			</FormField>

			<FormField label={t("song.publicNotes", "Public Notes")}>
				<FormTextarea
					name="public_notes"
					value={formValues.public_notes}
					onChange={handlePublicNotesChange}
					placeholder="Enter public notes..."
					autoExpand
				/>
			</FormField>

			<FormField label={t("song.privateNotes", "Private Notes")}>
				<FormTextarea
					name="private_notes"
					value={formValues.private_notes}
					onChange={handlePrivateNotesChange}
					placeholder="Enter private notes..."
					autoExpand
				/>
			</FormField>
		</FormSection>
	);
}
