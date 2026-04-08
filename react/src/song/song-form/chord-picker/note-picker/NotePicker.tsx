import { useTranslation } from "react-i18next";

import type { NotePickerEntry } from "@/react/music/note-picker/NotePickerEntry.type";
import toUnicodeAccidentals from "@/react/music/intervals/toUnicodeAccidentals";

type NotePickerProps = Readonly<{
	entries: readonly NotePickerEntry[];
	onToggle: (semitoneOffset: number) => void;
}>;

const ROOT_SEMITONE_OFFSET = 0;

const BASE_BUTTON_CLASSES =
	"flex min-w-11 flex-col items-center rounded border px-2 py-1.5 text-xs transition-colors";
const ROOT_BUTTON_CLASSES = "cursor-default border-blue-500 bg-blue-800/50 text-blue-200";
const ACTIVE_BUTTON_CLASSES = "border-blue-400 bg-blue-900/30 text-blue-200 hover:bg-blue-900/50";
const INACTIVE_BUTTON_CLASSES =
	"border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300";

function getNoteButtonClasses(isRoot: boolean, isActive: boolean): string {
	if (isRoot) {
		return `${BASE_BUTTON_CLASSES} ${ROOT_BUTTON_CLASSES}`;
	}
	if (isActive) {
		return `${BASE_BUTTON_CLASSES} ${ACTIVE_BUTTON_CLASSES}`;
	}

	return `${BASE_BUTTON_CLASSES} ${INACTIVE_BUTTON_CLASSES}`;
}

/**
 * Renders a row of 12 toggle buttons — one per chromatic position relative to the
 * chord root — so the user can add or remove notes to change the chord shape.
 * The root (semitone offset 0) is always active and cannot be deselected.
 *
 * @param entries - One entry per chromatic position (0–11) with active state and display labels
 * @param onToggle - Called with the semitone offset when a non-root button is clicked
 * @returns Note picker control
 */
export default function NotePicker({ entries, onToggle }: NotePickerProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm text-gray-300">{t("song.notePicker", "Note Picker")}</span>
			<div className="flex flex-wrap gap-1.5">
				{entries.map(({ displayInterval, semitoneOffset, isActive, letterName }) => {
					const isRoot = semitoneOffset === ROOT_SEMITONE_OFFSET;

					return (
						<button
							key={semitoneOffset}
							type="button"
							disabled={isRoot}
							onClick={() => {
								onToggle(semitoneOffset);
							}}
							className={getNoteButtonClasses(isRoot, isActive)}
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
