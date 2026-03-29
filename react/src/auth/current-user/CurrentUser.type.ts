import type { SlideOrientationPreferenceType } from "@/shared/user/slideOrientationPreference";

export type CurrentUser = Readonly<{
	email: string;
	name: string;
	role: string;
	slideOrientationPreference: SlideOrientationPreferenceType;
	userId: string;
	username: string;
}>;

