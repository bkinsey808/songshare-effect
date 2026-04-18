import { useTranslation } from "react-i18next";

const OPEN_CHORD_PICKER_VALUE = "__open-chord-picker__";

type ChordSelectProps = Readonly<{
	existingChordTokens: readonly string[];
	currentChordToken: string | undefined;
	isEditingChord: boolean;
	onSelectChord: (token: string) => void;
	onOpenChordPicker: () => void;
}>;

/**
 * Pulldown for inserting existing chords or opening the full chord picker.
 *
 * Existing chord tokens from the current lyrics field are listed first. The
 * final option opens the full picker to insert a new chord or edit the chord
 * at the current insertion point.
 *
 * @param existingChordTokens - Distinct chord tokens already present in the lyrics field
 * @param currentChordToken - Chord token at or before the current insertion point, if any
 * @param isEditingChord - Whether the current insertion point overlaps an existing chord token
 * @param onSelectChord - Inserts or replaces the selected existing chord token
 * @param onOpenChordPicker - Opens the full chord picker overlay
 * @returns Chord pulldown UI for the lyrics editor
 */
export default function ChordSelect({
	existingChordTokens,
	currentChordToken,
	isEditingChord,
	onSelectChord,
	onOpenChordPicker,
}: ChordSelectProps): ReactElement {
	const { t } = useTranslation();
	const actionLabel = isEditingChord
		? t("song.editChord", "Edit Chord")
		: t("song.insertChord", "Insert Chord");

	/**
	 * Routes the selected dropdown action to either existing-chord insertion or the picker overlay.
	 *
	 * @param event - Change event emitted by the chord pulldown
	 * @returns Nothing
	 */
	function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		const { value } = event.target;
		if (value === OPEN_CHORD_PICKER_VALUE) {
			onOpenChordPicker();
			return;
		}

		if (value !== "") {
			onSelectChord(value);
		}
	}

	return (
		<select
			value={currentChordToken ?? ""}
			onChange={handleChange}
			className="cursor-pointer rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-300 hover:border-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
			data-testid="chord-select"
		>
			<option value="" disabled hidden>
				{actionLabel}
			</option>
			{existingChordTokens.map((token) => (
				<option key={token} value={token} className="bg-gray-900 text-gray-200">
					{token}
				</option>
			))}
			<option value={OPEN_CHORD_PICKER_VALUE} className="bg-gray-900 text-gray-200">
				{actionLabel}
			</option>
		</select>
	);
}
