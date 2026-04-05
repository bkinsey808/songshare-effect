import { Schema } from "effect";

export const ChordDisplayCategory = {
	letters: "letters",
	scaleDegree: "scale_degree",
} as const;

export type ChordDisplayCategoryType =
	(typeof ChordDisplayCategory)[keyof typeof ChordDisplayCategory];

export const ChordDisplayCategorySchema: Schema.Schema<ChordDisplayCategoryType> = Schema.Literal(
	ChordDisplayCategory.letters,
	ChordDisplayCategory.scaleDegree,
);

/**
 * Falls back invalid category values to the default chord display category.
 *
 * @param value - Raw stored or requested display category
 * @returns Valid chord display category
 */
export function coerceChordDisplayCategory(
	value: string | undefined,
): ChordDisplayCategoryType {
	if (value === ChordDisplayCategory.letters || value === ChordDisplayCategory.scaleDegree) {
		return value;
	}

	return ChordDisplayCategory.scaleDegree;
}
