import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";

import DEFAULT_ROOT from "./defaultRoot";

/**
 * Falls back an empty song key to the default key used by the picker helpers.
 *
 * @param songKey - Current song key value from the form
 * @returns Valid song key for conversion helpers
 */
export default function getPickerSongKey(songKey: SongKey | ""): SongKey {
	return isSongKey(songKey) ? songKey : DEFAULT_ROOT;
}
