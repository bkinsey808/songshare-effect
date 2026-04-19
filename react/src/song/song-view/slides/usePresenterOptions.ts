import { useEffect, useState } from "react";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

type UsePresenterOptionsArgs = Readonly<{
	availableFields: readonly string[];
}>;

type PresenterOptions = Readonly<{
	selectedFields: readonly string[];
	showChords: boolean;
	chordDisplayMode: ChordDisplayModeType;
	showLanguageTags: boolean;
}>;

type UsePresenterOptionsResult = PresenterOptions &
	Readonly<{
		toggleField: (field: string) => void;
		toggleChords: () => void;
		setChordDisplayMode: (mode: ChordDisplayModeType) => void;
		toggleLanguageTags: () => void;
	}>;

/**
 * Manage local presenter options for field selection and annotation display.
 *
 * Initialises `selectedFields` to all available fields and `chordDisplayMode`
 * to the user's global preference. When `availableFields` changes the selection
 * is reset to include all newly available fields while preserving toggled-off
 * fields from the previous set.
 *
 * @param availableFields - All field keys derived from the song's language configuration
 * @returns Current presenter options and handlers to mutate them
 */
export default function usePresenterOptions({
	availableFields,
}: UsePresenterOptionsArgs): UsePresenterOptionsResult {
	const { chordDisplayMode: globalChordMode } = useChordDisplayModePreference();

	const [selectedFields, setSelectedFields] = useState<readonly string[]>(availableFields);
	const [showChords, setShowChords] = useState(true);
	const [chordDisplayMode, setChordDisplayMode] = useState<ChordDisplayModeType>(globalChordMode);
	const [showLanguageTags, setShowLanguageTags] = useState(false);

	const availableFieldsKey = availableFields.join(",");

	// Sync selected fields when the available fields change (e.g. song changes).
	useEffect(() => {
		const fields = availableFieldsKey === "" ? [] : availableFieldsKey.split(",");
		setSelectedFields((prev) => {
			const available = new Set(fields);
			const kept = prev.filter((fieldKey) => available.has(fieldKey));
			const added = fields.filter((fieldKey) => !prev.includes(fieldKey));
			return [...kept, ...added];
		});
	}, [availableFieldsKey]);

	/**
	 * Toggle a field on or off in the presenter selection.
	 *
	 * @param field - Field key to toggle
	 * @returns void
	 */
	function toggleField(field: string): void {
		setSelectedFields((prev) =>
			prev.includes(field) ? prev.filter((fieldKey) => fieldKey !== field) : [...prev, field],
		);
	}

	/**
	 * Toggle chord annotation visibility.
	 *
	 * @returns void
	 */
	function toggleChords(): void {
		setShowChords((prev) => !prev);
	}

	/**
	 * Toggle language tag annotation visibility.
	 *
	 * @returns void
	 */
	function toggleLanguageTags(): void {
		setShowLanguageTags((prev) => !prev);
	}

	return {
		selectedFields,
		showChords,
		chordDisplayMode,
		showLanguageTags,
		toggleField,
		toggleChords,
		setChordDisplayMode,
		toggleLanguageTags,
	};
}

export type { PresenterOptions };
