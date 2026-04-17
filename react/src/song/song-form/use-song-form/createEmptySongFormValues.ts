import type { SongFormValues } from "../song-form-types";
import { defaultLanguage } from "@/shared/language/supported-languages";

/**
 * Create a fresh empty controlled-values object for the Song form.
 *
 * @returns Default empty values for all controlled song fields
 */
export default function createEmptySongFormValues(): SongFormValues {
	return {
		song_name: "",
		song_slug: "",
		lyrics: [defaultLanguage],
		script: [],
		translations: [],
		key: "",
		short_credit: "",
		long_credit: "",
		public_notes: "",
		private_notes: "",
	};
}
