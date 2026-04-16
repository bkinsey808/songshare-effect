import { Schema } from "effect";

export const SlideNumberPreference = {
	show: "show",
	hide: "hide",
} as const;

export type SlideNumberPreferenceType =
	(typeof SlideNumberPreference)[keyof typeof SlideNumberPreference];

export const SlideNumberPreferenceSchema: Schema.Schema<SlideNumberPreferenceType> = Schema.Literal(
	SlideNumberPreference.show,
	SlideNumberPreference.hide,
);

/**
 * Coerces an input string into a valid SlideNumberPreferenceType.
 *
 * @param value - Candidate value (may be undefined)
 * @returns A valid SlideNumberPreferenceType, defaulting to `hide`
 */
export function coerceSlideNumberPreference(
	value: string | undefined,
): SlideNumberPreferenceType {
	if (value === SlideNumberPreference.show || value === SlideNumberPreference.hide) {
		return value;
	}

	return SlideNumberPreference.hide;
}
