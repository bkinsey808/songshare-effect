import { Schema } from "effect";

export const SlideOrientationPreference = {
	landscape: "landscape",
	portrait: "portrait",
	system: "system",
} as const;

export type SlideOrientationPreferenceType =
	(typeof SlideOrientationPreference)[keyof typeof SlideOrientationPreference];

export const SlideOrientationPreferenceSchema: Schema.Schema<SlideOrientationPreferenceType> =
	Schema.Literal(
	SlideOrientationPreference.landscape,
	SlideOrientationPreference.portrait,
	SlideOrientationPreference.system,
	);

export const ResolvedSlideOrientation = {
	landscape: "landscape",
	portrait: "portrait",
} as const;

export type ResolvedSlideOrientationType =
	(typeof ResolvedSlideOrientation)[keyof typeof ResolvedSlideOrientation];

/**
 * Ensures a given string value is a valid SlideOrientationPreferenceType.
 *
 * @param value - Candidate preference value (may be undefined)
 * @returns A valid SlideOrientationPreferenceType, defaulting to `system`
 */
export function coerceSlideOrientationPreference(
	value: string | undefined,
): SlideOrientationPreferenceType {
	if (
		value === SlideOrientationPreference.landscape ||
		value === SlideOrientationPreference.portrait ||
		value === SlideOrientationPreference.system
	) {
		return value;
	}

	return SlideOrientationPreference.system;
}
