import { useTranslation } from "react-i18next";

import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import type { LanguageEntry } from "@/shared/language/translationLanguages";

import useLanguagePicker from "./useLanguagePicker";

type LanguagePickerProps = Readonly<{
	value: string | undefined;
	onChange: (code: string | undefined) => void;
	excludedCodes?: readonly string[];
	optional?: boolean;
	placeholder?: string;
}>;

const NO_SUGGESTIONS = 0;

/**
 * Searchable language picker used for the song's `lyrics` and `script` fields.
 *
 * Renders a trigger button showing the current selection. When open, displays a
 * search input and ranked result list drawn from the canonical translation language
 * list. Optional fields additionally show a "None" option.
 *
 * @param value - Currently selected BCP 47 code, or undefined for none
 * @param onChange - Called with the new BCP 47 code, or undefined when cleared
 * @param excludedCodes - BCP 47 codes to hide from results (e.g. already-used roles)
 * @param optional - When true, renders a "None" option to clear the selection
 * @param placeholder - Text shown when no value is selected
 * @returns React element rendering the language picker
 */
export default function LanguagePicker({
	value,
	onChange,
	excludedCodes = [],
	optional = false,
	placeholder,
}: LanguagePickerProps): ReactElement {
	const { t } = useTranslation();
	const {
		isOpen,
		inputValue,
		suggestions,
		selectedEntry,
		containerRef,
		searchRef,
		handleToggle,
		handleInputChange,
		handleKeyDown,
		handleSelect,
		handleClear,
	} = useLanguagePicker({ value, onChange, excludedCodes });
	const hasSuggestions = suggestions.length > NO_SUGGESTIONS;
	const shouldShowNoResults = inputValue.trim() !== "";
	const showNoResults = hasSuggestions ? false : shouldShowNoResults;
	const resolvedPlaceholder = placeholder ?? t("song.languagePicker.placeholder", "Select language...");
	const noneLabel = t("song.languagePicker.none", "None");
	const searchPlaceholder = t("song.languagePicker.searchPlaceholder", "Search languages...");
	const noResultsLabel = t("song.languagePicker.noResults", "No languages found");

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				className="flex w-full items-center justify-between rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-left text-white transition hover:border-gray-500"
				onClick={handleToggle}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
			>
				<span className={selectedEntry === undefined ? "text-gray-400" : "text-white"}>
					{selectedEntry === undefined ? resolvedPlaceholder : selectedEntry.name}
				</span>
				<ChevronDownIcon
					className={`size-4 shrink-0 text-gray-300 transition ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen ? (
				<div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 p-3 shadow-2xl ring-1 ring-white/10">
					{optional ? (
						<button
							type="button"
							className={`mb-2 w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
								value === undefined
									? "border-blue-400 bg-blue-500/20 text-white"
									: "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
							}`}
							onClick={handleClear}
						>
							{noneLabel}
						</button>
					) : undefined}

					<input
						ref={searchRef}
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder={searchPlaceholder}
						className="mb-2 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
					/>

					{hasSuggestions ? (
						<ul role="listbox" className="max-h-48 space-y-0.5 overflow-y-auto">
							{suggestions.map((entry: LanguageEntry) => (
								<li key={entry.tag}>
									<button
										type="button"
										role="option"
										aria-selected={entry.tag === value}
										className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition ${
											entry.tag === value
												? "bg-blue-500/20 text-white"
												: "text-gray-200 hover:bg-gray-800"
										}`}
										onClick={() => {
											handleSelect(entry);
										}}
									>
										<span className="flex flex-col">
											<span>{entry.name}</span>
											{entry.nativeName === entry.name ? undefined : (
												<span className="text-xs text-gray-400">{entry.nativeName}</span>
											)}
										</span>
										<span className="ml-2 shrink-0 font-mono text-xs text-gray-500">
											{entry.tag}
										</span>
									</button>
								</li>
							))}
						</ul>
					) : undefined}

					{showNoResults ? (
						<p className="px-2 py-1 text-sm text-gray-400">{noResultsLabel}</p>
					) : undefined}
				</div>
			) : undefined}
		</div>
	);
}
