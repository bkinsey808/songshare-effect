import { useTranslation } from "react-i18next";

import type { NoteSearchEntry } from "@/react/music/note-picker/NoteSearchEntry.type";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import toUnicodeAccidentals from "@/react/music/intervals/toUnicodeAccidentals";

type NoteSearchProps = Readonly<{
	entries: readonly NoteSearchEntry[];
	onToggle: (semitoneOffset: number) => void;
}>;

const BASE_BUTTON_CLASSES =
	"flex min-w-11 flex-col items-center rounded border px-2 py-1.5 text-xs transition-colors";
const DEFAULT_BUTTON_CLASSES =
	"border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300";
const REQUIRED_BUTTON_CLASSES = "border-blue-400 bg-blue-900/30 text-blue-200 hover:bg-blue-900/50";
const EXCLUDED_BUTTON_CLASSES = "border-red-500 bg-red-900/30 text-red-300 hover:bg-red-900/50";

function getNoteSearchButtonClasses(toggleState: NoteSearchToggleState): string {
	if (toggleState === "required") {
		return `${BASE_BUTTON_CLASSES} ${REQUIRED_BUTTON_CLASSES}`;
	}
	if (toggleState === "excluded") {
		return `${BASE_BUTTON_CLASSES} ${EXCLUDED_BUTTON_CLASSES}`;
	}
	return `${BASE_BUTTON_CLASSES} ${DEFAULT_BUTTON_CLASSES}`;
}

/**
 * Renders a row of 12 toggle buttons — one per chromatic position relative to the chord root —
 * for filtering chord search results. Each button cycles through three states: default (neutral),
 * required (chord must include this note), and excluded (chord must not include this note).
 *
 * @param entries - One entry per chromatic position (0–11) with toggle state and display labels
 * @param onToggle - Called with the semitone offset when a button is clicked
 * @returns Note search filter control
 */
export default function NoteSearch({ entries, onToggle }: NoteSearchProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm text-gray-300">{t("song.noteSearch", "Note Search")}</span>
			<div className="flex flex-wrap gap-1.5">
				{entries.map(({ displayInterval, semitoneOffset, toggleState, letterName }) => (
					<button
						key={semitoneOffset}
						type="button"
						onClick={() => {
							onToggle(semitoneOffset);
						}}
						className={getNoteSearchButtonClasses(toggleState)}
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
				))}
			</div>
		</div>
	);
}
