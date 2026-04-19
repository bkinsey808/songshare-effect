import { useTranslation } from "react-i18next";

import Chip from "@/react/lib/design-system/Chip";
import type { SongKey } from "@/shared/song/songKeyOptions";

import getLetterSuffix from "./getLetterSuffix";

type SongChordChipProps = Readonly<{
	token: string;
	songKey: SongKey | "";
	isUnusedChord: boolean;
	onEditSongChord: (token: string) => void;
	onRemoveSongChord: (token: string) => void;
}>;

/**
 * Renders a single chord chip in the song chords list.
 *
 * When the chord is unused (not present in any lyric field), the label is a
 * clickable edit button and a remove button is shown. When the chord is in use,
 * the label is plain text and no remove button is rendered.
 *
 * When the chord root is a roman degree and a song key is set, the absolute
 * letter root is shown in parentheses in a muted colour.
 *
 * @param token - Stored chord token (e.g. "[I M]" or "[C M]")
 * @param songKey - Active song key used to compute the letter-name suffix
 * @param isUnusedChord - Whether the chord is currently absent from all lyric fields
 * @param onEditSongChord - Opens the chord picker to edit this token
 * @param onRemoveSongChord - Removes this token from the song chord list
 * @returns Chord chip element
 */
export default function SongChordChip({
	token,
	songKey,
	isUnusedChord,
	onEditSongChord,
	onRemoveSongChord,
}: SongChordChipProps): ReactElement {
	const { t } = useTranslation();
	const letterSuffix = getLetterSuffix(token, songKey);

	const label = (
		<>
			{token}
			{letterSuffix !== "" && <span className="text-blue-400">{letterSuffix}</span>}
		</>
	);

	return (
		<Chip
			onRemove={
				isUnusedChord
					? () => {
							onRemoveSongChord(token);
						}
					: undefined
			}
			removeAriaLabel={t("song.removeUnusedChord", "Remove unused chord {{token}}", {
				token,
			})}
		>
			{isUnusedChord ? (
				<button
					type="button"
					className="rounded-full px-0.5 text-left text-blue-300 hover:text-blue-100"
					onClick={() => {
						onEditSongChord(token);
					}}
					aria-label={t("song.editUnusedChord", "Edit unused chord {{token}}", {
						token,
					})}
				>
					{label}
				</button>
			) : (
				label
			)}
		</Chip>
	);
}
