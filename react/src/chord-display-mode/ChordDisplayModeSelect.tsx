import useLocale from "@/react/lib/language/locale/useLocale";
import {
	ChordDisplayCategory,
} from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import useChordDisplayModeSelect from "./useChordDisplayModeSelect";

/**
 * Renders the signed-in user's chord display preference controls.
 *
 * @returns Preference selects for authenticated users, or nothing for guests
 */
export default function ChordDisplayModeSelect(): ReactElement | undefined {
	const { t } = useLocale();
	const {
		currentUser,
		chordDisplayCategory,
		chordLetterDisplay,
		chordScaleDegreeDisplay,
		handleCategoryChange,
		handleLetterDisplayChange,
		handleScaleDegreeDisplayChange,
	} = useChordDisplayModeSelect();

	if (currentUser === undefined) {
		return undefined;
	}

	return (
		<div className="flex flex-wrap items-end gap-4">
			<label className="flex flex-col gap-1 text-sm text-gray-300">
				<span>{t("chordDisplayMode.label", "Chord Display")}</span>
				<select
					className="rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
					value={chordDisplayCategory}
					onChange={handleCategoryChange}
					aria-label={t("chordDisplayMode.label", "Chord Display")}
					data-testid="chord-display-category-select"
				>
					<option value={ChordDisplayCategory.letters}>
						{t("chordDisplayMode.lettersCategory", "Letter")}
					</option>
					<option value={ChordDisplayCategory.scaleDegree}>
						{t("chordDisplayMode.scaleDegreeCategory", "Scale Degree")}
					</option>
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm text-gray-300">
				<span>{t("chordDisplayMode.letterDisplay", "Letter Display")}</span>
				<select
					className="rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
					value={chordLetterDisplay}
					onChange={handleLetterDisplayChange}
					aria-label={t("chordDisplayMode.letterDisplay", "Letter Display")}
					data-testid="chord-letter-display-select"
				>
					<option value={ChordLetterDisplay.standard}>
						{t("chordDisplayMode.letters", "Standard Letters")}
					</option>
					<option value={ChordLetterDisplay.german}>
						{t("chordDisplayMode.german", "German Letters")}
					</option>
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm text-gray-300">
				<span>{t("chordDisplayMode.scaleDegreeDisplay", "Scale Degree Display")}</span>
				<select
					className="rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
					value={chordScaleDegreeDisplay}
					onChange={handleScaleDegreeDisplayChange}
					aria-label={t("chordDisplayMode.scaleDegreeDisplay", "Scale Degree Display")}
					data-testid="chord-scale-degree-display-select"
				>
					<option value={ChordScaleDegreeDisplay.roman}>
						{t("chordDisplayMode.roman", "Roman Numerals")}
					</option>
					<option value={ChordScaleDegreeDisplay.solfege}>
						{t("chordDisplayMode.solfege", "Solfège")}
					</option>
					<option value={ChordScaleDegreeDisplay.sargam}>
						{t("chordDisplayMode.sargam", "Sargam")}
					</option>
				</select>
			</label>
		</div>
	);
}
