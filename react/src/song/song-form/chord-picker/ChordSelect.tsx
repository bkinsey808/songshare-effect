import { useTranslation } from "react-i18next";

import normalizeStoredChordBody from "@/shared/music/chord-display/normalizeStoredChordBody";

type ChordSelectProps = Readonly<{
	songChords: readonly string[];
	currentChordToken: string | undefined;
	onSelectChord: (token: string) => void;
}>;

/**
 * Pulldown for inserting a chord from the song's stored chord list into the lyrics field.
 *
 * Raw chord bodies from the song's `chords` field are listed as options.
 * Selecting one inserts or replaces the bracketed chord token at the current
 * cursor position.
 *
 * @param songChords - Stored chord bodies defined on the song
 * @param currentChordToken - Bracketed chord token at or before the current insertion point, if any
 * @param onSelectChord - Inserts or replaces the selected stored chord body at the cursor
 * @returns Chord pulldown UI for the lyrics editor
 */
export default function ChordSelect({
	songChords,
	currentChordToken,
	onSelectChord,
}: ChordSelectProps): ReactElement {
	const { t } = useTranslation();
	const currentChordBody =
		currentChordToken === undefined ? undefined : normalizeStoredChordBody(currentChordToken);

	/**
	 * Inserts the selected stored chord body into the lyrics field.
	 *
	 * @param event - Change event emitted by the chord pulldown
	 * @returns Nothing
	 */
	function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		const { value } = event.target;
		if (value !== "") {
			onSelectChord(value);
		}
	}

	return (
		<select
			value={currentChordBody ?? ""}
			onChange={handleChange}
			className="cursor-pointer rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-300 hover:border-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
			data-testid="chord-select"
		>
			<option value="" disabled hidden>
				{t("song.insertChord", "Insert Chord")}
			</option>
			{songChords.map((chordBody) => (
				<option key={chordBody} value={chordBody} className="bg-gray-900 text-gray-200">
					{chordBody}
				</option>
			))}
		</select>
	);
}
