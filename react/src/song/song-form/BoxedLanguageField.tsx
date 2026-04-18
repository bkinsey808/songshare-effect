import { useTranslation } from "react-i18next";

import FormField from "@/react/lib/design-system/form/FormField";

import MultiLanguagePicker from "./language-picker/MultiLanguagePicker";

const PICKER_BOX_CLASS = "rounded border border-gray-600 bg-gray-900/60 px-3 py-3";

type BoxedLanguageFieldProps = Readonly<{
	label: string;
	error:
		| Readonly<{
				message: string;
				params?: Record<string, unknown>;
		  }>
		| undefined;
	value: readonly string[];
	excludedCodes: readonly string[];
	placeholder: string;
	emptyText: string;
	onChange: (codes: string[]) => void;
}>;

/**
 * Shared boxed language-picker field used by song form language sections.
 *
 * @param label - Field label text
 * @param error - Optional validation error payload
 * @param value - Selected language codes
 * @param excludedCodes - Language codes that cannot be selected
 * @param placeholder - Picker placeholder text
 * @param emptyText - Empty-state message
 * @param onChange - Called with the next selected language codes
 * @returns Boxed language field UI
 */
export default function BoxedLanguageField({
	label,
	error,
	value,
	excludedCodes,
	placeholder,
	emptyText,
	onChange,
}: BoxedLanguageFieldProps): ReactElement {
	const { t } = useTranslation();

	return (
		<FormField
			label={label}
			as="fieldset"
			error={
				error === undefined
					? undefined
					: t(error.message, {
							...error.params,
							defaultValue: error.message,
						})
			}
		>
			<div className={PICKER_BOX_CLASS}>
				<MultiLanguagePicker
					value={value}
					onChange={onChange}
					excludedCodes={excludedCodes}
					placeholder={placeholder}
					emptyText={emptyText}
				/>
			</div>
		</FormField>
	);
}
