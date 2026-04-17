import { useTranslation } from "react-i18next";

import XIcon from "@/react/lib/design-system/icons/XIcon";
import { findLanguageByTag } from "@/shared/language/translationLanguages";

import LanguagePicker from "./LanguagePicker";

const EMPTY_TRANSLATION_COUNT = 0;

type TranslationLanguagePickerProps = Readonly<{
	value: readonly string[];
	onChange: (codes: string[]) => void;
	excludedCodes?: readonly string[];
}>;

/**
 * Multi-select language picker for the song `translations` array.
 *
 * Renders the current selections as removable pills and reuses the shared
 * language picker as an "add another language" control.
 *
 * @param value - Selected translation language codes
 * @param onChange - Called with the next ordered translations array
 * @param excludedCodes - Additional language codes that cannot be selected
 * @returns React element rendering selected languages plus an add picker
 */
export default function TranslationLanguagePicker({
	value,
	onChange,
	excludedCodes = [],
}: TranslationLanguagePickerProps): ReactElement {
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
					{t(
						"song.translationLanguagePicker.empty",
						"No translation languages selected yet.",
					)}
				</p>
			) : (
				<ul className="flex flex-wrap gap-2">
					{value.map((code) => {
						const entry = findLanguageByTag(code);
						const label = entry?.name ?? code;
						const supportingLabel = entry?.nativeName ?? code;

						return (
							<li key={code}>
								<span className="inline-flex items-center gap-2 rounded-full border border-blue-700/40 bg-blue-900/30 px-3 py-1 text-sm text-blue-100">
									<span className="flex items-center gap-2">
										<span>{label}</span>
										{supportingLabel === label ? undefined : (
											<span className="text-xs text-blue-200/70">{supportingLabel}</span>
										)}
										<span className="font-mono text-xs text-blue-200/70">{code}</span>
									</span>
									<button
										type="button"
										onClick={() => {
											handleRemoveLanguage(code);
										}}
										aria-label={t(
											"song.translationLanguagePicker.removeAria",
											"Remove {{language}}",
											{ language: label },
										)}
										className="rounded-full p-0.5 text-blue-200 transition hover:bg-blue-700/40 hover:text-white"
									>
										<XIcon className="size-3" />
									</button>
								</span>
							</li>
						);
					})}
				</ul>
			)}

			<LanguagePicker
				value={undefined}
				onChange={handleAddLanguage}
				excludedCodes={pickerExcludedCodes}
				placeholder={t(
					"song.translationLanguagePicker.addPlaceholder",
					"Add translation language...",
				)}
			/>
		</div>
	);
}
