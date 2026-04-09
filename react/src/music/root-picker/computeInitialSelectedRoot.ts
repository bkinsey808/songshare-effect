import getAbsoluteRootFromRomanDegree from "@/shared/music/chord-display/getAbsoluteRootFromRomanDegree";
import getRomanDegreeForStorage from "@/shared/music/chord-display/getRomanDegreeForStorage";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import computePickerSongKey from "@/react/music/root-picker/computePickerSongKey";
import DEFAULT_ROOT from "@/react/music/root-picker/defaultRoot";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import parseInitialSciToken from "@/react/music/sci/parseInitialSciToken";

/**
 * Chooses the initial picker root from the existing token, song key, and display mode.
 *
 * @param chordDisplayMode - Active chord display mode for the picker
 * @param initialChordToken - Existing chord token when editing
 * @param songKey - Current song key for roman-degree conversion
 * @returns Initial root selection for the picker UI
 */
export default function computeInitialSelectedRoot({
	chordDisplayMode,
	initialChordToken,
	songKey,
}: Readonly<{
	chordDisplayMode: ChordDisplayModeType;
	initialChordToken: string | undefined;
	songKey: SongKey | "";
}>): SelectedRoot {
	const parsedInitialToken = parseInitialSciToken(initialChordToken);
	const pickerSongKey = computePickerSongKey(songKey);

	if (parsedInitialToken !== undefined) {
		if (chordDisplayMode === "roman") {
			if (parsedInitialToken.rootType === "roman") {
				return {
					root: parsedInitialToken.root,
					rootType: "roman",
					label: parsedInitialToken.root,
				};
			}

			const romanRoot = getRomanDegreeForStorage(parsedInitialToken.root, pickerSongKey);
			if (romanRoot !== undefined) {
				return {
					root: romanRoot,
					rootType: "roman",
					label: romanRoot,
				};
			}
		}

		if (parsedInitialToken.rootType === "absolute") {
			return {
				root: parsedInitialToken.root,
				rootType: "absolute",
				label: parsedInitialToken.root,
			};
		}

		const absoluteRoot = getAbsoluteRootFromRomanDegree(parsedInitialToken.root, pickerSongKey);
		if (absoluteRoot !== undefined) {
			return {
				root: absoluteRoot,
				rootType: "absolute",
				label: absoluteRoot,
			};
		}
	}

	if ((chordDisplayMode === "letters" || chordDisplayMode === "roman") && isSongKey(songKey)) {
		if (chordDisplayMode === "roman") {
			return {
				root: "I",
				rootType: "roman",
				label: "I",
			};
		}

		return {
			root: songKey,
			rootType: "absolute",
			label: songKey,
		};
	}

	if (chordDisplayMode === "roman") {
		return {
			root: "I",
			rootType: "roman",
			label: "I",
		};
	}

	return {
		root: DEFAULT_ROOT,
		rootType: "absolute",
		label: DEFAULT_ROOT,
	};
}
