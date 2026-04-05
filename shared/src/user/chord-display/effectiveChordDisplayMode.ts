import { Schema } from "effect";

export const ChordDisplayMode = {
	roman: "roman",
	letters: "letters",
	solfege: "solfege",
	sargam: "sargam",
	german: "german",
} as const;

export type ChordDisplayModeType = (typeof ChordDisplayMode)[keyof typeof ChordDisplayMode];

export const ChordDisplayModeSchema: Schema.Schema<ChordDisplayModeType> = Schema.Literal(
	ChordDisplayMode.roman,
	ChordDisplayMode.letters,
	ChordDisplayMode.solfege,
	ChordDisplayMode.sargam,
	ChordDisplayMode.german,
);

/**
 * Falls back invalid persisted mode values to the default display mode.
 *
 * @param value - Raw stored or requested chord display mode
 * @returns Valid effective chord display mode
 */
export function coerceChordDisplayMode(value: string | undefined): ChordDisplayModeType {
	if (
		value === ChordDisplayMode.roman ||
		value === ChordDisplayMode.letters ||
		value === ChordDisplayMode.solfege ||
		value === ChordDisplayMode.sargam ||
		value === ChordDisplayMode.german
	) {
		return value;
	}

	return ChordDisplayMode.roman;
}
