import { useEffect, useRef } from "react";

import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";

/**
 * Converts a roman-numeral root back to an absolute note when the song key is cleared.
 *
 * @param selectedRoot - Currently selected root
 * @param songKey - Current song key (may be empty string when no key is set)
 * @param setSelectedRoot - Setter for the selected root state
 * @param setSelectedBassNote - Setter to clear the bass note state
 * @returns void
 */
export default function useSongKeyRootSync({
	selectedRoot,
	songKey,
	setSelectedRoot,
	setSelectedBassNote,
}: Readonly<{
	selectedRoot: SelectedRoot;
	songKey: SongKey | "";
	setSelectedRoot: (root: SelectedRoot) => void;
	setSelectedBassNote: (bassNote: SongKey | undefined) => void;
}>): void {
	const previousSongKeyRef = useRef<SongKey | "">(songKey);

	// Convert a roman-numeral root to absolute when the song key is cleared.
	useEffect(() => {
		const previousSongKey = previousSongKeyRef.current;
		previousSongKeyRef.current = songKey;

		if (isSongKey(previousSongKey) && !isSongKey(songKey) && selectedRoot.rootType === "roman") {
			const absoluteRoot = getAbsoluteRootFromRomanDegree(selectedRoot.root, previousSongKey);
			if (absoluteRoot !== undefined) {
				setSelectedRoot({
					root: absoluteRoot,
					rootType: "absolute",
					label: absoluteRoot,
				});
				setSelectedBassNote(undefined);
			}
		}
	}, [selectedRoot, songKey, setSelectedRoot, setSelectedBassNote]);
}
