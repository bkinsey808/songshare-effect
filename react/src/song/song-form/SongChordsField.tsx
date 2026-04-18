import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import FormField from "@/react/lib/design-system/form/FormField";
import type { SongKey } from "@/shared/song/songKeyOptions";

import SongChordChip from "./SongChordChip";

const EMPTY_CHORD_COUNT = 0;

type SongChordsFieldProps = Readonly<{
	chords: readonly string[];
	songKey: SongKey | "";
	lyricChords: readonly string[];
	onOpenSongChordPicker: () => void;
	onEditSongChord: (token: string) => void;
	onRemoveSongChord: (token: string) => void;
}>;

/**
 * Renders the chord chip array and "Add Chord" button for the song form.
 *
 * @param chords - All song-level chord tokens
 * @param songKey - Active song key used to compute letter-name suffixes on roman-degree chips
 * @param lyricChords - Chord tokens currently referenced in lyrics (used to distinguish unused chords)
 * @param onOpenSongChordPicker - Opens the full-page picker to add a new chord
 * @param onEditSongChord - Opens the full-page picker to edit an unused chord
 * @param onRemoveSongChord - Removes an unused chord from the song
 * @returns Chord chips form field
 */
export default function SongChordsField({
	chords,
	songKey,
	lyricChords,
	onOpenSongChordPicker,
	onEditSongChord,
	onRemoveSongChord,
}: SongChordsFieldProps): ReactElement {
	const { t } = useTranslation();
	const lyricChordSet = new Set(lyricChords);

	return (
		<FormField label={t("song.chords", "Chords")} as="div">
			<div
				className="flex min-h-11 flex-col gap-3 rounded border border-gray-600 bg-gray-900/60 px-3 py-3"
				data-testid="song-chords-array"
			>
				<div className="flex min-h-8 flex-wrap items-start gap-2">
					{chords.length > EMPTY_CHORD_COUNT ? (
						chords.map((token) => (
							<SongChordChip
								key={token}
								token={token}
								songKey={songKey}
								isUnusedChord={!lyricChordSet.has(token)}
								onEditSongChord={onEditSongChord}
								onRemoveSongChord={onRemoveSongChord}
							/>
						))
					) : (
						<span className="text-sm text-gray-400">
							{t("song.noChordsDetectedYet", "No chords detected yet.")}
						</span>
					)}
				</div>
				<div className="flex items-center justify-start">
					<Button
						size="compact"
						variant="outlineSecondary"
						onClick={onOpenSongChordPicker}
						data-testid="open-song-chord-picker"
					>
						{t("song.addChord", "Add Chord")}
					</Button>
				</div>
			</div>
		</FormField>
	);
}
