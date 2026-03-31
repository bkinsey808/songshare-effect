import type { SlideNumberPreferenceType } from "@/shared/user/slideNumberPreference";
import type { SlideOrientationPreferenceType } from "@/shared/user/slideOrientationPreference";

export type CurrentUser = Readonly<{
	email: string;
	name: string;
	role: string;
	slideNumberPreference: SlideNumberPreferenceType;
	slideOrientationPreference: SlideOrientationPreferenceType;
	userId: string;
	username: string;
}>;

