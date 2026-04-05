import { Schema } from "effect";

export const ChordLetterDisplay = {
	standard: "standard",
	german: "german",
} as const;

export type ChordLetterDisplayType =
	(typeof ChordLetterDisplay)[keyof typeof ChordLetterDisplay];

export const ChordLetterDisplaySchema: Schema.Schema<ChordLetterDisplayType> = Schema.Literal(
	ChordLetterDisplay.standard,
	ChordLetterDisplay.german,
);

/**
 * Falls back invalid letter-display values to the default setting.
 *
 * @param value - Raw stored or requested letter-display value
 * @returns Valid chord letter display preference
 */
export function coerceChordLetterDisplay(value: string | undefined): ChordLetterDisplayType {
	if (value === ChordLetterDisplay.standard || value === ChordLetterDisplay.german) {
		return value;
	}

	return ChordLetterDisplay.standard;
}
