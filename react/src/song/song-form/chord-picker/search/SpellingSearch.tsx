import { useTranslation } from "react-i18next";

import toUnicodeAccidentals from "@/react/music/intervals/toUnicodeAccidentals";
import type { NoteSearchEntry } from "@/react/music/note-picker/NoteSearchEntry.type";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

type SpellingSearchProps = Readonly<{
	entries: readonly NoteSearchEntry[];
	onToggle: (semitoneOffset: number) => void;
}>;

const ROOT_SEMITONE_OFFSET = 0;
const BASE_BUTTON_CLASSES =
	"flex min-w-11 flex-col items-center rounded border px-2 py-1.5 text-xs transition-colors";
const DEFAULT_BUTTON_CLASSES =
	"border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300";
const REQUIRED_BUTTON_CLASSES = "border-blue-400 bg-blue-900/30 text-blue-200 hover:bg-blue-900/50";
const EXCLUDED_BUTTON_CLASSES = "border-red-500 bg-red-900/30 text-red-300 hover:bg-red-900/50";
const ROOT_BUTTON_CLASSES = "cursor-default border-blue-500 bg-blue-800/50 text-blue-200";

/**
 * Compute the button classes for a spelling-search toggle button.
 *
 * @param isRoot - Whether the button represents the root semitone
 * @param toggleState - Current toggle state for the semitone
 * @returns Tailwind CSS class string for the button
 */
function getSpellingSearchButtonClasses(
	isRoot: boolean,
	toggleState: NoteSearchToggleState,
): string {
	if (isRoot) {
		return `${BASE_BUTTON_CLASSES} ${ROOT_BUTTON_CLASSES}`;
	}
	if (toggleState === "required") {
		return `${BASE_BUTTON_CLASSES} ${REQUIRED_BUTTON_CLASSES}`;
	}
	if (toggleState === "excluded") {
		return `${BASE_BUTTON_CLASSES} ${EXCLUDED_BUTTON_CLASSES}`;
	}
	return `${BASE_BUTTON_CLASSES} ${DEFAULT_BUTTON_CLASSES}`;
}

/**
 * Renders a row of 12 three-state toggle buttons for chord spellings relative to the root.
 *
 * Each button can be neutral, required, or excluded, and optionally shows the absolute
 * note label for the current root when one is available.
 *
 * @param entries - The note entries to render as toggle buttons
 * @param onToggle - Callback invoked with the semitone offset when a button is toggled
 * @returns A React element containing the spelling-search UI
 */
export default function SpellingSearch({
	entries,
	onToggle,
}: SpellingSearchProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2" data-testid="spelling-search">
			<span className="text-sm text-gray-300">{t("song.spellingSearch", "Spelling Search")}</span>
			<div className="flex flex-wrap gap-1.5">
				{entries.map(({ displayInterval, semitoneOffset, toggleState, letterName }) => {
					const isRoot = semitoneOffset === ROOT_SEMITONE_OFFSET;

					return (
						<button
							key={semitoneOffset}
							type="button"
							disabled={isRoot}
							onClick={() => {
								onToggle(semitoneOffset);
							}}
							className={getSpellingSearchButtonClasses(isRoot, toggleState)}
						>
							<span className="font-semibold leading-tight">
								{toUnicodeAccidentals(displayInterval)}
							</span>
							{letterName !== undefined && (
								<span className="leading-tight text-gray-400">
									{toUnicodeAccidentals(letterName)}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
