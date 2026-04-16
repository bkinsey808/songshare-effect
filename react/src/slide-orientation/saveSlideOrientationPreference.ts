import { apiUserSlideOrientationPreferencePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import type { SlideOrientationPreferenceType } from "@/shared/user/slideOrientationPreference";

type SaveSlideOrientationPreferenceResponse = Readonly<{
	data?: {
		slideOrientationPreference?: SlideOrientationPreferenceType;
	};
	success?: boolean;
}>;

/**
 * Persist the user's slide orientation preference to the server.
 *
 * @param slideOrientationPreference - Preference to save (`landscape`, `portrait`, or `system`)
 * @returns The persisted preference returned from server, or the input value on fallback
 */
export default async function saveSlideOrientationPreference(
	slideOrientationPreference: SlideOrientationPreferenceType,
): Promise<SlideOrientationPreferenceType> {
	const response = await fetch(apiUserSlideOrientationPreferencePath, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			slideOrientationPreference,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to save slide orientation preference (${response.status})`);
	}

	const payloadUnknown: unknown = await response.json();
	const payload: SaveSlideOrientationPreferenceResponse = isRecord(payloadUnknown)
		? payloadUnknown
		: {};
	return payload.data?.slideOrientationPreference ?? slideOrientationPreference;
}
