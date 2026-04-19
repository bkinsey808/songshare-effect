import { useTranslation } from "react-i18next";

import Chip from "@/react/lib/design-system/Chip";
import { findLanguageByTag } from "@/shared/language/translationLanguages";

import LanguagePicker from "./LanguagePicker";

const EMPTY_TRANSLATION_COUNT = 0;

type MultiLanguagePickerProps = Readonly<{
	value: readonly string[];
	onChange: (codes: string[]) => void;
	excludedCodes?: readonly string[];
	placeholder?: string;
	emptyText?: string;
}>;

/**
 * Multi-select language picker for the song language fields.
 *
 * Renders the current selections as removable pills and reuses the shared
 * language picker as an "add another language" control.
 *
 * @param value - Selected translation language codes
 * @param onChange - Called with the next ordered translations array
 * @param excludedCodes - Additional language codes that cannot be selected
 * @param placeholder - Custom placeholder text for the picker
 * @param emptyText - Text to display when no languages are selected
 * @returns React element rendering selected languages plus an add picker
 */
export default function MultiLanguagePicker({
	value,
	onChange,
	excludedCodes = [],
	placeholder,
	emptyText,
}: MultiLanguagePickerProps): ReactElement {
	const { t } = useTranslation();

	/**
	 * Append a newly selected language if it is not already present.
	 *
	 * @param code - BCP 47 language code chosen from the picker
	 * @returns void
	 */
	function handleAddLanguage(code: string | undefined): void {
		if (code === undefined || value.includes(code)) {
			return;
		}
		onChange([...value, code]);
	}

	/**
	 * Remove a selected translation language while preserving order.
	 *
	 * @param code - BCP 47 language code to remove
	 * @returns void
	 */
	function handleRemoveLanguage(code: string): void {
		onChange(value.filter((selectedCode) => selectedCode !== code));
	}

	const pickerExcludedCodes = [...excludedCodes, ...value];

	return (
		<div className="flex flex-col gap-3">
			{value.length === EMPTY_TRANSLATION_COUNT ? (
				<p className="text-sm text-gray-400">
					{emptyText ?? t("song.languagePicker.empty", "No languages selected yet.")}
				</p>
			) : (
				<ul className="flex flex-wrap gap-2">
					{value.map((code) => {
						const entry = findLanguageByTag(code);
						const label = entry?.name ?? code;
						const supportingLabel = entry?.nativeName ?? code;

						return (
							<li key={code}>
								<Chip
									onRemove={() => {
										handleRemoveLanguage(code);
									}}
									removeAriaLabel={t(
										"song.translationLanguagePicker.removeAria",
										"Remove {{language}}",
										{ language: label },
									)}
								>
									<span className="flex items-center gap-2">
										<span>{label}</span>
										{supportingLabel !== label && (
											<span className="text-xs text-blue-200/70">{supportingLabel}</span>
										)}
										<span className="font-mono text-xs text-blue-200/70">{code}</span>
									</span>
								</Chip>
							</li>
						);
					})}
				</ul>
			)}

			<LanguagePicker
				value={undefined}
				onChange={handleAddLanguage}
				excludedCodes={pickerExcludedCodes}
				placeholder={placeholder ?? t("song.languagePicker.addPlaceholder", "Add language...")}
			/>
		</div>
	);
}
