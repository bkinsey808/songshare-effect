import { useTranslation } from "react-i18next";

import FormField from "@/react/lib/design-system/form/FormField";
import FormInput from "@/react/lib/design-system/form/FormInput";
import FormSection from "@/react/lib/design-system/form/FormSection";
import FormTextarea from "@/react/lib/design-system/form/FormTextarea";
import TagInput from "@/react/tag/input/TagInput";
import type { SongKey } from "@/shared/song/songKeyOptions";

import LanguagePicker from "./language-picker/LanguagePicker";
import TranslationLanguagePicker from "./language-picker/TranslationLanguagePicker";
import SongKeyFormField from "./SongKeyFormField";

type SongFormFieldsProps = Readonly<{
	getFieldError: (
		fieldName: keyof {
			song_name: string;
			song_slug: string;
			lyrics: string;
			script?: string;
			key?: SongKey;
			short_credit?: string;
			long_credit?: string;
			translations: readonly string[];
		},
	) => { message: string; params?: Record<string, unknown> } | undefined;
	onSongNameBlur: () => void;
	songNameRef: React.RefObject<HTMLInputElement | null>;
	songSlugRef: React.RefObject<HTMLInputElement | null>;
	formValues: {
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
	setFormValue: <Field extends keyof SongFormFieldsProps["formValues"]>(
		field: Field,
		value: SongFormFieldsProps["formValues"][Field],
	) => void;
	tags: readonly string[];
	setTags: (tags: string[]) => void;
}>;

/**
 * Renders the form fields used in the Song editor.
 *
 * @param getFieldError - Function to resolve validation errors for a field
 * @param onSongNameBlur - Called when the song name field is blurred (used to generate slug)
 * @param songNameRef - Ref to the song name input
 * @param songSlugRef - Ref to the song slug input
 * @param formValues - Controlled form values
 * @param setFormValue - Setter for individual form values
 * @param tags - Current tag values for the song
 * @param setTags - Setter to update the tag list
 * @returns React element rendering the set of fields for the song form
 */
export default function SongFormFields({
	getFieldError,
	onSongNameBlur,
	songNameRef,
	songSlugRef,
	formValues,
	setFormValue,
	tags,
	setTags,
}: SongFormFieldsProps): ReactElement {
	const { t } = useTranslation();

	// Extract onChange handlers to satisfy linter
	/**
	 * Handle updates to the song name input.
	 *
	 * @param event - Change event from the song name input
	 * @returns void
	 */
	function handleSongNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("song_name", event.target.value);
	}
	/**
	 * Handle updates to the song slug input.
	 *
	 * @param event - Change event from the song slug input
	 * @returns void
	 */
	function handleSongSlugChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("song_slug", event.target.value);
	}
	/**
	 * Handle updates to the short credit input.
	 *
	 * @param event - Change event from the short credit input
	 * @returns void
	 */
	function handleShortCreditChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setFormValue("short_credit", event.target.value);
	}
	/**
	 * Handle updates to the long credit textarea.
	 *
	 * @param event - Change event from the long credit textarea
	 * @returns void
	 */
	function handleLongCreditChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("long_credit", event.target.value);
	}
	/**
	 * Handle updates to the public notes textarea.
	 *
	 * @param event - Change event from the public notes textarea
	 * @returns void
	 */
	function handlePublicNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		setFormValue("public_notes", event.target.value);
	}
	/**
	 * Handle updates to the private notes textarea.
	 *
	 * @param event - Change event from the private notes textarea
	 * @returns void
	 */
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
				label={t("song.lyricsLanguage", "Lyrics Language")}
				error={(() => {
					const lyricsError = getFieldError("lyrics");
					return lyricsError
						? t(lyricsError.message, {
								...lyricsError.params,
								defaultValue: lyricsError.message,
							})
						: undefined;
				})()}
			>
				<input type="hidden" name="lyrics" value={formValues.lyrics} />
				<LanguagePicker
					value={formValues.lyrics}
					onChange={(code) => {
						if (code !== undefined) {
							setFormValue("lyrics", code);
						}
					}}
					excludedCodes={formValues.script === undefined ? [] : [formValues.script]}
				/>
			</FormField>

			<FormField
				label={t("song.scriptLanguage", "Script Language")}
				error={(() => {
					const scriptError = getFieldError("script");
					return scriptError
						? t(scriptError.message, {
								...scriptError.params,
								defaultValue: scriptError.message,
							})
						: undefined;
				})()}
			>
				{formValues.script === undefined ? undefined : (
					<input type="hidden" name="script" value={formValues.script} />
				)}
				<LanguagePicker
					value={formValues.script}
					onChange={(code) => {
						setFormValue("script", code);
					}}
					excludedCodes={[formValues.lyrics]}
					optional
					placeholder={t("song.languagePicker.none", "None")}
				/>
			</FormField>

			<FormField
				label={t("song.translationLanguages", "Translation Languages")}
				error={(() => {
					const translationsError = getFieldError("translations");
					return translationsError
						? t(translationsError.message, {
								...translationsError.params,
								defaultValue: translationsError.message,
							})
						: undefined;
				})()}
			>
				<TranslationLanguagePicker
					value={formValues.translations}
					onChange={(codes) => {
						setFormValue("translations", codes);
					}}
					excludedCodes={[
						formValues.lyrics,
						...(formValues.script === undefined ? [] : [formValues.script]),
					]}
				/>
			</FormField>

			<SongKeyFormField
				getFieldError={getFieldError}
				value={formValues.key}
				onChange={(nextValue) => {
					setFormValue("key", nextValue);
				}}
			/>

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

			<FormField label={t("song.tags", "Tags")}>
				<TagInput value={tags} onChange={setTags} />
			</FormField>
		</FormSection>
	);
}
