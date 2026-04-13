import { useState } from "react";
import { useTranslation } from "react-i18next";

import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import Button from "@/react/lib/design-system/Button";
import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import type { SongKey } from "@/shared/song/songKeyOptions";

import SongKeyPicker from "../song-key-picker/SongKeyPicker";
import ChordSearchResults from "./ChordSearchResults";
import SciInversionsSection from "./inversions/ChordInversionsSection";
import NotePicker from "./note-picker/NotePicker";
import NoteSearch from "./note-search/NoteSearch";
import ChordPreview from "./preview/ChordPreview";
import ChordRootPicker from "./root-picker/ChordRootPicker";
import SpellingSearch from "./spelling-search/SpellingSearch";
import useChordPicker from "./use-chord-picker/useChordPicker";

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

type ChordPickerProps = Readonly<{
	songKey: SongKey | "";
	setSongKey: (value: SongKey | "") => void;
	hasPendingInsertTarget: boolean;
	initialChordToken: string | undefined;
	isEditingChord: boolean;
	closeChordPicker: () => void;
	insertChordFromPicker: (token: string) => void;
}>;

/**
 * Lets the user browse chord roots and shapes, preview the result, and insert a token.
 *
 * @param songKey - Current song key used for display and roman-degree conversion
 * @param setSongKey - Updates the song key from within the picker
 * @param hasPendingInsertTarget - Whether the picker can currently insert into the editor
 * @param initialChordToken - Existing chord token when editing a previously inserted chord
 * @param isEditingChord - Whether the picker is editing an existing chord instead of inserting a new one
 * @param closeChordPicker - Closes the picker overlay
 * @param insertChordFromPicker - Inserts the chosen canonical chord token into the editor
 * @returns Full-screen chord picker dialog
 */
export default function ChordPicker({
	songKey,
	setSongKey,
	hasPendingInsertTarget,
	initialChordToken,
	isEditingChord,
	closeChordPicker,
	insertChordFromPicker,
}: ChordPickerProps): ReactElement {
	const { t } = useTranslation();
	const [isSearchSectionOpen, setIsSearchSectionOpen] = useState(true);
	const {
		alternatePreviewLabel,
		alternatePreviewToken,
		canonicalToken,
		chordDisplayCategory,
		chordDisplayMode,
		chordInversions,
		inversionBaseShapeName,
		displayedShapes,
		handleInsert,
		inversionPreviewTokens,
		inversionSlashPreviewTokens,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
		allShapeInversions,
		directShapeOrdinals,
		getNoteSearchRoot,
		handleNoteToggle,
		handleSpellingSearchToggle,
		handleNoteSearchToggle,
		handleSelectInversion,
		handleSelectShapeInversion,
		includeInversions,
		includeInversionsInputId,
		isShapeSelected,
		selectedBassNote,
		minNotes,
		minNotesInputId,
		maxNotes,
		maxNotesInputId,
		notePickerEntries,
		spellingSearchEntries,
		noteSearchEntries,
		previewToken,
		query,
		rootPickerDisplayMode,
		searchInputId,
		selectedRoot,
		selectedShape,
		setIncludeInversions,
		setMinNotes,
		setMaxNotes,
		setQuery,
		setSelectedRoot,
		setSelectedShapeCode,
	} = useChordPicker({
		songKey,
		initialChordToken,
		closeChordPicker,
		insertChordFromPicker,
	});

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950">
			<div className="mx-auto min-h-full w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
				<div className="rounded-2xl border border-gray-800 bg-gray-900/95 shadow-2xl">
					<div className="border-b border-gray-800 px-4 py-4 sm:px-6">
						<div>
							<h2 className="text-2xl font-bold text-white">
								{isEditingChord
									? t("song.editChord", "Edit Chord")
									: t("song.insertChord", "Insert Chord")}
							</h2>
							<p className="mt-1 max-w-2xl text-sm text-gray-400">
								{t(
									"song.insertChordPageDescription",
									"Choose a root and chord shape, then insert it into the lyrics without leaving your song draft.",
								)}
							</p>
							<div className="mt-4 flex flex-wrap items-end gap-4">
								<ChordDisplayModeSelect />
								<label className="flex min-w-[16rem] flex-col gap-1 text-sm text-gray-300">
									<span>{t("song.songKey", "Song Key")}</span>
									<SongKeyPicker value={songKey} onChange={setSongKey} />
								</label>
							</div>
						</div>
					</div>

					<div className="space-y-4 px-4 py-5 sm:px-6">
						<div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-start">
							<ChordRootPicker
								selectedRoot={selectedRoot}
								setSelectedRoot={setSelectedRoot}
								allowAnyRoot={isEditingChord}
								chordDisplayMode={rootPickerDisplayMode}
								songKey={songKey}
							/>
						<div className="min-[900px]:flex-1">
								<NotePicker
									entries={notePickerEntries}
									onToggle={handleNoteToggle}
									showLetterNamesOnly={selectedRoot.rootType === "any"}
									hideRootButton={selectedRoot.rootType !== "any"}
								/>
							</div>
						</div>
						<ChordPreview
							previewToken={previewToken}
							alternatePreviewLabel={alternatePreviewLabel}
							alternatePreviewToken={alternatePreviewToken}
							selectedShapeName={selectedShape?.name}
							selectedShapeSpelling={previewShapeSpelling}
							selectedShapeAltNames={selectedShape?.altNames ?? ""}
							slashPreviewToken={slashPreviewToken}
							slashPreviewShapeName={slashPreviewShapeName}
						/>
						<SciInversionsSection
							inversions={chordInversions}
							originalShapeName={inversionBaseShapeName}
							chordDisplayCategory={chordDisplayCategory}
							songKey={songKey}
							selectedBassNote={selectedBassNote}
							inversionPreviewTokens={inversionPreviewTokens}
							slashPreviewTokens={inversionSlashPreviewTokens}
							onSelectInversion={handleSelectInversion}
						/>
						<div className="rounded-xl border border-gray-800 bg-gray-950/40">
							<button
								type="button"
								className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
								onClick={() => {
									setIsSearchSectionOpen(!isSearchSectionOpen);
								}}
								aria-expanded={isSearchSectionOpen}
								data-testid="chord-search-section-toggle"
							>
								<span className="text-sm font-semibold uppercase tracking-wide text-gray-400">
									{t("common.search", "Search")}
								</span>
								<ChevronDownIcon
									className={`size-4 text-gray-300 transition ${
										isSearchSectionOpen ? "rotate-180" : ""
									}`}
								/>
							</button>
							{isSearchSectionOpen ? (
								<div className="space-y-4 border-t border-gray-800 px-4 py-4">
									<div className="flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-start">
										<label
											className="flex flex-col gap-1 text-sm text-gray-300"
											htmlFor={minNotesInputId}
										>
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

										<label
											className="flex flex-col gap-1 text-sm text-gray-300"
											htmlFor={maxNotesInputId}
										>
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
										<SpellingSearch
											entries={spellingSearchEntries}
											onToggle={handleSpellingSearchToggle}
										/>
										<NoteSearch entries={noteSearchEntries} onToggle={handleNoteSearchToggle} />
									</div>

									<label
										className="flex flex-col gap-1 text-sm text-gray-300"
										htmlFor={searchInputId}
									>
										<span>{t("song.chordSearch", "Search Shapes")}</span>
										<input
											id={searchInputId}
											type="text"
											value={query}
											onChange={(event) => {
												setQuery(event.target.value);
											}}
											placeholder={t(
												"song.chordSearchPlaceholder",
												"Search by name, code, or b3",
											)}
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
										handleSelectShapeInversion={handleSelectShapeInversion}
									/>
								</div>
							) : undefined}
						</div>

						{hasPendingInsertTarget ? undefined : (
							<div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-3 text-sm text-amber-200">
								{t(
									"song.insertChordMissingTarget",
									"Open this picker from a lyrics field to insert the selected chord.",
								)}
							</div>
						)}

						<div
							className="-mx-4 sticky bottom-0 z-10 flex gap-2 border-t border-gray-800 bg-gray-900/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6"
							data-testid="chord-picker-actions"
						>
							<Button size="compact" variant="outlineSecondary" onClick={closeChordPicker}>
								{t("common.cancel", "Cancel")}
							</Button>
							<Button
								size="compact"
								variant="primary"
								onClick={handleInsert}
								disabled={canonicalToken === undefined}
								data-testid="confirm-insert-chord"
							>
								{isEditingChord ? t("common.update", "Update") : t("song.insert", "Insert")}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
