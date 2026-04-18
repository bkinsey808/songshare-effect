import { useState } from "react";

import useSlideFieldEditor from "@/react/song/song-form/slides-editor/slide-detail-card/useSlideFieldEditor";
import type { Slide } from "@/react/song/song-form/song-form-types";

type ActiveLanguageField = "lyrics" | "script" | undefined;

type UseSortableGridCellsParams = Readonly<{
	slideId: string;
	slide: Slide;
	fields: readonly string[];
	songChords: readonly string[];
	editFieldValue: (params: Readonly<{ slideId: string; field: string; value: string }>) => void;
}>;

type UseSortableGridCellsReturn = Readonly<{
	lyricsEditor: ReturnType<typeof useSlideFieldEditor>;
	scriptEditor: ReturnType<typeof useSlideFieldEditor>;
	hasLyrics: boolean;
	hasScript: boolean;
	activeLanguageField: ActiveLanguageField;
	handleLyricsSyncSelection: () => void;
	handleScriptSyncSelection: () => void;
}>;

/**
 * Hook managing per-row textarea selection, chord editing state, and
 * background interactions for sortable grid cells.
 *
 * @param slideId - Current slide id for the row
 * @param slide - Slide data object
 * @param fields - Rendered fields for the row
 * @param songChords - Chord tokens defined on the song
 * @param editFieldValue - Setter for editing a field value
 * @returns Hook outputs including refs and handlers
 */
export default function useSortableGridCells({
	slideId,
	slide,
	fields,
	songChords,
	editFieldValue,
}: UseSortableGridCellsParams): UseSortableGridCellsReturn {
	const hasLyrics = fields.includes("lyrics");
	const hasScript = fields.includes("script");
	const [activeLanguageField, setActiveLanguageField] = useState<ActiveLanguageField>(undefined);

	/**
	 * Updates a field value for the current slide.
	 *
	 * @param field - Field key to update
	 * @param value - New value for the field
	 * @returns void
	 */
	function handleEditFieldValue({ field, value }: { field: string; value: string }): void {
		editFieldValue({ slideId, field, value });
	}

	const lyricsEditor = useSlideFieldEditor({
		field: "lyrics",
		slide,
		songChords,
		onEditFieldValue: handleEditFieldValue,
	});

	const scriptEditor = useSlideFieldEditor({
		field: "script",
		slide,
		songChords: [],
		onEditFieldValue: handleEditFieldValue,
	});

	/**
	 * Marks lyrics as the active editor and refreshes its selection snapshot.
	 *
	 * @returns Nothing
	 */
	function handleLyricsSyncSelection(): void {
		setActiveLanguageField("lyrics");
		lyricsEditor.handleSyncSelection();
	}

	/**
	 * Marks script as the active editor and refreshes its selection snapshot.
	 *
	 * @returns Nothing
	 */
	function handleScriptSyncSelection(): void {
		setActiveLanguageField("script");
		scriptEditor.handleSyncSelection();
	}

	return {
		lyricsEditor,
		scriptEditor,
		hasLyrics,
		hasScript,
		activeLanguageField,
		handleLyricsSyncSelection,
		handleScriptSyncSelection,
	};
}
