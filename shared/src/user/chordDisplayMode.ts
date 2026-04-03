import { Schema } from "effect";

export const ChordDisplayMode = {
	roman: "roman",
	letters: "letters",
	solfege: "solfege",
	indian: "indian",
	german: "german",
} as const;

export type ChordDisplayModeType =
	(typeof ChordDisplayMode)[keyof typeof ChordDisplayMode];

export const ChordDisplayModeSchema: Schema.Schema<ChordDisplayModeType> = Schema.Literal(
	ChordDisplayMode.roman,
	ChordDisplayMode.letters,
	ChordDisplayMode.solfege,
	ChordDisplayMode.indian,
	ChordDisplayMode.german,
);

export function coerceChordDisplayMode(value: string | undefined): ChordDisplayModeType {
	if (
		value === ChordDisplayMode.roman ||
		value === ChordDisplayMode.letters ||
		value === ChordDisplayMode.solfege ||
		value === ChordDisplayMode.indian ||
		value === ChordDisplayMode.german
	) {
		return value;
	}

	return ChordDisplayMode.roman;
}
