import { apiUserChordDisplayModePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import type { ChordDisplayCategoryType } from "@/shared/user/chord-display/chordDisplayCategory";
import type { ChordLetterDisplayType } from "@/shared/user/chordLetterDisplay";
import type { ChordScaleDegreeDisplayType } from "@/shared/user/chordScaleDegreeDisplay";

type SaveChordDisplayPreferencesResponse = Readonly<{
	data?: {
		chordDisplayCategory?: ChordDisplayCategoryType;
		chordLetterDisplay?: ChordLetterDisplayType;
		chordScaleDegreeDisplay?: ChordScaleDegreeDisplayType;
	};
	success?: boolean;
}>;

type SaveChordDisplayPreferencesParams = Readonly<{
	chordDisplayCategory: ChordDisplayCategoryType;
	chordLetterDisplay: ChordLetterDisplayType;
	chordScaleDegreeDisplay: ChordScaleDegreeDisplayType;
}>;

/**
 * Persists the user's split chord display preferences and returns the saved values.
 *
 * @param chordDisplayCategory - Top-level display category to store
 * @param chordLetterDisplay - Letter-display preference to store
 * @param chordScaleDegreeDisplay - Scale-degree-display preference to store
 * @returns Saved chord display preferences, falling back to submitted values if the API omits fields
 */
export default async function saveChordDisplayPreferences({
	chordDisplayCategory,
	chordLetterDisplay,
	chordScaleDegreeDisplay,
}: SaveChordDisplayPreferencesParams): Promise<SaveChordDisplayPreferencesParams> {
	const response = await fetch(apiUserChordDisplayModePath, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			chordDisplayCategory,
			chordLetterDisplay,
			chordScaleDegreeDisplay,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to save chord display preferences (${response.status})`);
	}

	const payloadUnknown: unknown = await response.json();
	const payload: SaveChordDisplayPreferencesResponse = isRecord(payloadUnknown)
		? payloadUnknown
		: {};

	return {
		chordDisplayCategory: payload.data?.chordDisplayCategory ?? chordDisplayCategory,
		chordLetterDisplay: payload.data?.chordLetterDisplay ?? chordLetterDisplay,
		chordScaleDegreeDisplay: payload.data?.chordScaleDegreeDisplay ?? chordScaleDegreeDisplay,
	};
}
