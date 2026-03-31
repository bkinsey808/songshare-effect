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

export function coerceSlideNumberPreference(
	value: string | undefined,
): SlideNumberPreferenceType {
	if (value === SlideNumberPreference.show || value === SlideNumberPreference.hide) {
		return value;
	}

	return SlideNumberPreference.hide;
}
