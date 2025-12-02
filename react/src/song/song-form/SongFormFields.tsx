import { useTranslation } from "react-i18next";

import FormField from "../../design-system/form/FormField";
import FormInput from "../../design-system/form/FormInput";
import FormSection from "../../design-system/form/FormSection";
import FormTextarea from "../../design-system/form/FormTextarea";

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
}>;

export default function SongFormFields({
	getFieldError,
	onSongNameBlur,
	songNameRef,
	songSlugRef,
}: SongFormFieldsProps): ReactElement {
	const { t } = useTranslation();

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
				<FormInput ref={songNameRef} name="song_name" onBlur={onSongNameBlur} />
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
				<FormInput ref={songSlugRef} name="song_slug" />
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
				<FormInput name="short_credit" />
			</FormField>

			<FormField label={t("song.longCredit", "Long Credit")}>
				<FormTextarea name="long_credit" placeholder="Enter long credit..." autoExpand />
			</FormField>

			<FormField label={t("song.publicNotes", "Public Notes")}>
				<FormTextarea name="public_notes" placeholder="Enter public notes..." autoExpand />
			</FormField>

			<FormField label={t("song.privateNotes", "Private Notes")}>
				<FormTextarea name="private_notes" placeholder="Enter private notes..." autoExpand />
			</FormField>
		</FormSection>
	);
}
