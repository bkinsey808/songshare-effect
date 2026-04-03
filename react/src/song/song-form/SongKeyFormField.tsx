import { useTranslation } from "react-i18next";

import FormField from "@/react/lib/design-system/form/FormField";
import type { SongKey } from "@/shared/song/songKeyOptions";

import SongKeyPicker from "./song-key-picker/SongKeyPicker";

type SongKeyFormFieldProps = Readonly<{
	getFieldError: (
		fieldName: "key",
	) => { message: string; params?: Record<string, unknown> } | undefined;
	value: SongKey | "";
	onChange: (value: SongKey | "") => void;
}>;

/**
 * Renders the dedicated song-key field with translated validation feedback.
 *
 * @param getFieldError - Resolver for the current key validation error
 * @param value - Current song key form value
 * @param onChange - Called when the selected key changes
 * @returns Form field wrapping the song key picker
 */
export default function SongKeyFormField({
	getFieldError,
	value,
	onChange,
}: SongKeyFormFieldProps): ReactElement {
	const { t } = useTranslation();
	const songKeyError = getFieldError("key");

	return (
		<FormField
			label={t("song.key", "Key")}
			error={
				songKeyError
					? t(songKeyError.message, {
							...songKeyError.params,
							defaultValue: songKeyError.message,
						})
					: undefined
			}
		>
			<SongKeyPicker value={value} onChange={onChange} />
		</FormField>
	);
}
