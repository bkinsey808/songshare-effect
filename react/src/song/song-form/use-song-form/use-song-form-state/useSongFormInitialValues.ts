import { type SongFormValuesFromSchema as SongFormData } from "@/react/song/song-form/songSchema";
import { defaultLanguage } from "@/shared/language/supported-languages";

type UseSongFormInitialValuesParams = {
	readonly songId: string | undefined;
	readonly initialSlideId: string;
};

/**
 * Build the initial form values for a new or existing song.
 *
 * @param songId - Song id being edited (undefined for new songs)
 * @param initialSlideId - The slide id of the first slide
 * @returns Initial form values partial
 */
export default function useSongFormInitialValues({
	songId,
	initialSlideId,
}: UseSongFormInitialValuesParams): Partial<SongFormData> {
	return {
		song_id: songId,
		song_name: "",
		song_slug: "",
		lyrics: [defaultLanguage],
		script: [],
		translations: [],
		short_credit: "",
		long_credit: "",
		private_notes: "",
		public_notes: "",
		slide_order: [initialSlideId],
		tags: [],
		slides: {
			[initialSlideId]: {
				slide_name: "Slide 1",
				field_data: {},
			},
		},
	};
}
