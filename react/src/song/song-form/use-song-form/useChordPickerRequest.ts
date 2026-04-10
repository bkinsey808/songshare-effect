import { useState } from "react";

import { type SongFormChordPickerRequest } from "../song-form-types";

type UseChordPickerRequestReturn = {
	pendingChordPickerRequest: SongFormChordPickerRequest | undefined;
	openChordPicker: (request: SongFormChordPickerRequest) => void;
	closeChordPicker: () => void;
	insertChordFromPicker: (token: string) => void;
};

/**
 * Hook that manages chord picker request state for the Song form.
 *
 * Tracks a pending chord picker request and provides handlers to open the
 * picker, close it without a selection, or submit a chord token and close.
 *
 * @returns State and handlers for the chord picker lifecycle
 */
export default function useChordPickerRequest(): UseChordPickerRequestReturn {
	const [pendingChordPickerRequest, setPendingChordPickerRequest] = useState<
		SongFormChordPickerRequest | undefined
	>(undefined);

	function openChordPicker(request: SongFormChordPickerRequest): void {
		setPendingChordPickerRequest(request);
	}

	function closeChordPicker(): void {
		setPendingChordPickerRequest(undefined);
	}

	function insertChordFromPicker(token: string): void {
		pendingChordPickerRequest?.submitChord(token);
		setPendingChordPickerRequest(undefined);
	}

	return { pendingChordPickerRequest, openChordPicker, closeChordPicker, insertChordFromPicker };
}
