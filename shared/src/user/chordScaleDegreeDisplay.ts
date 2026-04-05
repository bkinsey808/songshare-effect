import { Schema } from "effect";

export const ChordScaleDegreeDisplay = {
	roman: "roman",
	solfege: "solfege",
	sargam: "sargam",
} as const;

export type ChordScaleDegreeDisplayType =
	(typeof ChordScaleDegreeDisplay)[keyof typeof ChordScaleDegreeDisplay];

export const ChordScaleDegreeDisplaySchema: Schema.Schema<ChordScaleDegreeDisplayType> =
	Schema.Literal(
		ChordScaleDegreeDisplay.roman,
		ChordScaleDegreeDisplay.solfege,
		ChordScaleDegreeDisplay.sargam,
	);

/**
 * Falls back invalid scale-degree-display values to the default setting.
 *
 * @param value - Raw stored or requested scale-degree-display value
 * @returns Valid chord scale-degree display preference
 */
export function coerceChordScaleDegreeDisplay(
	value: string | undefined,
): ChordScaleDegreeDisplayType {
	if (
		value === ChordScaleDegreeDisplay.roman ||
		value === ChordScaleDegreeDisplay.solfege ||
		value === ChordScaleDegreeDisplay.sargam
	) {
		return value;
	}

	return ChordScaleDegreeDisplay.roman;
}
