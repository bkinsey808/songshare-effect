import { apiUserChordDisplayModePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import type { ChordDisplayModeType } from "@/shared/user/chordDisplayMode";

type SaveChordDisplayModeResponse = Readonly<{
	data?: {
		chordDisplayMode?: ChordDisplayModeType;
	};
	success?: boolean;
}>;

export default async function saveChordDisplayMode(
	chordDisplayMode: ChordDisplayModeType,
): Promise<ChordDisplayModeType> {
	const response = await fetch(apiUserChordDisplayModePath, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			chordDisplayMode,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to save chord display mode (${response.status})`);
	}

	const payloadUnknown: unknown = await response.json();
	const payload: SaveChordDisplayModeResponse = isRecord(payloadUnknown) ? payloadUnknown : {};

	return payload.data?.chordDisplayMode ?? chordDisplayMode;
}
