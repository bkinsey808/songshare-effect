import { useState } from "react";
import { useTranslation } from "react-i18next";

import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import { type SciInversion } from "@/react/music/inversions/computeSciInversions";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import ChordSearchResults from "./ChordSearchResults";
import NoteSearch from "./NoteSearch";
import SpellingSearch from "./SpellingSearch";
import useChordSearch from "./useChordSearch";

const DYAD_NOTE_COUNT = 2;
const TRIAD_NOTE_COUNT = 3;
const TETRAD_NOTE_COUNT = 4;
const FIVE_NOTE_COUNT = 5;
const SIX_NOTE_COUNT = 6;
const SEVEN_NOTE_COUNT = 7;
const EIGHT_NOTE_COUNT = 8;
const NOTE_COUNT_OPTIONS = [
	DYAD_NOTE_COUNT,
	TRIAD_NOTE_COUNT,
	TETRAD_NOTE_COUNT,
	FIVE_NOTE_COUNT,
	SIX_NOTE_COUNT,
	SEVEN_NOTE_COUNT,
	EIGHT_NOTE_COUNT,
] as const;

type ChordSearchSectionProps = Readonly<{
	initialChordToken: string | undefined;
	absoluteRoot: SongKey | undefined;
	selectedShapeCode: string;
	songKey: SongKey | "";
	rootPickerDisplayMode: ChordDisplayModeType;
	selectedRoot: SelectedRoot;
	setSelectedShapeCode: (shapeCode: string) => void;
	selectedBassNote: SongKey | undefined;
	inversionBaseShapeCode: string | undefined;
	handleSelectShapeInversion: (sourceShapeCode: string, inversion: SciInversion) => void;
	/** True when a shape result card should be highlighted as selected. */
	shapeHighlightActive: boolean;
}>;

/**
 * Collapsible search panel for the chord picker.
 *
 * Owns all chord search state (note-count filters, spelling/note search toggles,
 * text query) and renders the results list (shapes and inversions).
 *
 * @param initialChordToken - Existing chord token used to derive initial search state
 * @param absoluteRoot - Current absolute root note for note-search toggle handling
 * @param selectedShapeCode - Currently selected shape code for result highlighting
 * @param songKey - Current song key for display and roman-degree conversion
 * @param rootPickerDisplayMode - Display mode used to derive the initial note-search root
 * @param selectedRoot - Current chord root selection used for card display
 * @param setSelectedShapeCode - Selects a chord shape by code
 * @param selectedBassNote - Active bass note when an inversion is selected
 * @param inversionBaseShapeCode - Source shape code of the active inversion
 * @param handleSelectShapeInversion - Handles clicking an inversion result card
 * @param shapeHighlightActive - True when shape cards should show a selected highlight
 * @returns Collapsible chord search panel
 */
export default function ChordSearchSection({
	initialChordToken,
	absoluteRoot,
	selectedShapeCode,
	songKey,
	rootPickerDisplayMode,
	selectedRoot,
	setSelectedShapeCode,
	selectedBassNote,
	inversionBaseShapeCode,
	handleSelectShapeInversion,
	shapeHighlightActive,
}: ChordSearchSectionProps): ReactElement {
	const { t } = useTranslation();
	const { chordDisplayMode } = useChordDisplayModePreference();
	const [isOpen, setIsOpen] = useState(true);

	const {
		query,
		setQuery,
		minNotes,
		setMinNotes,
		maxNotes,
		setMaxNotes,
		includeInversions,
		setIncludeInversions,
		searchInputId,
		minNotesInputId,
		maxNotesInputId,
		includeInversionsInputId,
		displayedShapes,
		allShapeInversions,
		directShapeOrdinals,
		spellingSearchEntries,
		noteSearchEntries,
		getNoteSearchRoot,
		handleSpellingSearchToggle,
		handleNoteSearchToggle,
		isShapeSelected,
	} = useChordSearch({
		initialChordToken,
		absoluteRoot,
		selectedShapeCode,
		songKey,
		chordDisplayMode,
		rootPickerDisplayMode,
		shapeHighlightActive,
	});

	return (
		<div className="rounded-xl border border-gray-800 bg-gray-950/40">
			<button
				type="button"
				className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
				onClick={() => {
					setIsOpen(!isOpen);
				}}
				aria-expanded={isOpen}
				data-testid="chord-search-section-toggle"
			>
				<span className="text-sm font-semibold uppercase tracking-wide text-gray-400">
					{t("common.search", "Search")}
				</span>
				<ChevronDownIcon
					className={`size-4 text-gray-300 transition ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{isOpen ? (
				<div className="space-y-4 border-t border-gray-800 px-4 py-4">
					<div className="flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-start">
						<label className="flex flex-col gap-1 text-sm text-gray-300" htmlFor={minNotesInputId}>
							<span>{t("song.chordMinNotes", "Min Notes")}</span>
							<select
								id={minNotesInputId}
								value={String(minNotes)}
								onChange={(event) => {
									setMinNotes(Number(event.target.value));
								}}
								className="rounded border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white"
								data-testid="chord-min-notes"
							>
								{NOTE_COUNT_OPTIONS.map((noteCount) => (
									<option key={noteCount} value={String(noteCount)}>
										{noteCount}
									</option>
								))}
							</select>
						</label>

						<label className="flex flex-col gap-1 text-sm text-gray-300" htmlFor={maxNotesInputId}>
							<span>{t("song.chordMaxNotes", "Max Notes")}</span>
							<select
								id={maxNotesInputId}
								value={String(maxNotes)}
								onChange={(event) => {
									setMaxNotes(Number(event.target.value));
								}}
								className="rounded border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white"
								data-testid="chord-max-notes"
							>
								{NOTE_COUNT_OPTIONS.map((noteCount) => (
									<option key={noteCount} value={String(noteCount)}>
										{noteCount}
									</option>
								))}
							</select>
						</label>

						<label
							className="flex cursor-pointer flex-col gap-1 text-sm text-gray-300"
							htmlFor={includeInversionsInputId}
						>
							<span>{t("song.includeInversions", "Include inversions")}</span>
							<input
								id={includeInversionsInputId}
								type="checkbox"
								checked={includeInversions}
								onChange={(event) => {
									setIncludeInversions(event.target.checked);
								}}
								className="h-9.5 w-9.5 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-950"
								style={
									includeInversions
										? {
												backgroundImage:
													"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' d='M1.5 8 L4 12 L14.5 3'/%3E%3C/svg%3E\")",
												backgroundRepeat: "no-repeat",
												backgroundPosition: "center",
												backgroundSize: "14px 14px",
											}
										: undefined
								}
								data-testid="include-inversions-checkbox"
							/>
						</label>
					</div>
					<div className="space-y-4">
						<SpellingSearch entries={spellingSearchEntries} onToggle={handleSpellingSearchToggle} />
						<NoteSearch entries={noteSearchEntries} onToggle={handleNoteSearchToggle} />
					</div>

					<label className="flex flex-col gap-1 text-sm text-gray-300" htmlFor={searchInputId}>
						<span>{t("song.chordSearch", "Search Shapes")}</span>
						<input
							id={searchInputId}
							type="text"
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
							}}
							placeholder={t("song.chordSearchPlaceholder", "Search by name, code, or b3")}
							className="rounded border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white"
							data-testid="chord-shape-search"
						/>
					</label>
					<ChordSearchResults
						displayedShapes={displayedShapes}
						allShapeInversions={allShapeInversions}
						selectedRoot={selectedRoot}
						chordDisplayMode={chordDisplayMode}
						songKey={songKey}
						getNoteSearchRoot={getNoteSearchRoot}
						isShapeSelected={isShapeSelected}
						setSelectedShapeCode={setSelectedShapeCode}
						directShapeOrdinals={directShapeOrdinals}
						selectedBassNote={selectedBassNote}
						inversionBaseShapeCode={inversionBaseShapeCode}
						handleSelectShapeInversion={handleSelectShapeInversion}
					/>
				</div>
			) : undefined}
		</div>
	);
}
