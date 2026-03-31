import { apiUserSlideNumberPreferencePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import type { SlideNumberPreferenceType } from "@/shared/user/slideNumberPreference";

type SaveSlideNumberPreferenceResponse = Readonly<{
	data?: {
		slideNumberPreference?: SlideNumberPreferenceType;
	};
	success?: boolean;
}>;

export default async function saveSlideNumberPreference(
	slideNumberPreference: SlideNumberPreferenceType,
): Promise<SlideNumberPreferenceType> {
	const response = await fetch(apiUserSlideNumberPreferencePath, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			slideNumberPreference,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to save slide number preference (${response.status})`);
	}

	const payloadUnknown: unknown = await response.json();
	const payload: SaveSlideNumberPreferenceResponse = isRecord(payloadUnknown)
		? payloadUnknown
		: {};
	return payload.data?.slideNumberPreference ?? slideNumberPreference;
}
