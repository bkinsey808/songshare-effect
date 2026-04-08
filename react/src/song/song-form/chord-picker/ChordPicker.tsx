import { useTranslation } from "react-i18next";

import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import Button from "@/react/lib/design-system/Button";
import formatAccidentals from "@/react/music/intervals/formatAccidentals";
import preferSharpIntervals from "@/react/music/intervals/preferSharpIntervals";
import type { SongKey } from "@/shared/song/songKeyOptions";

import SongKeyPicker from "../song-key-picker/SongKeyPicker";
import SciInversionsSection from "./inversions/ChordInversionsSection";
import NotePicker from "./note-picker/NotePicker";
import NoteSearch from "./note-search/NoteSearch";
import ChordPreview from "./preview/ChordPreview";
import ChordSearchResultCard from "./result-card/ChordSearchResultCard";
import ChordRootPicker from "./root-picker/ChordRootPicker";
import useChordPicker from "./use-chord-picker/useChordPicker";

const DYAD_NOTE_COUNT = 2;
const TRIAD_NOTE_COUNT = 3;
const TETRAD_NOTE_COUNT = 4;
const FIVE_NOTE_COUNT = 5;
const SIX_NOTE_COUNT = 6;
const SEVEN_NOTE_COUNT = 7;
const EIGHT_NOTE_COUNT = 8;
const EMPTY_SHAPE_COUNT = 0;
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
	const {
		alternatePreviewLabel,
		alternatePreviewToken,
		chordDisplayCategory,
		chordDisplayMode,
		chordInversions,
		inversionBaseShapeName,
		displayedShapes,
		inversionPreviewTokens,
		inversionSlashPreviewTokens,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
		allShapeInversions,
		directShapeOrdinals,
		getNoteSearchRoot,
		handleNoteToggle,
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
						<ChordRootPicker
							selectedRoot={selectedRoot}
							setSelectedRoot={setSelectedRoot}
							chordDisplayMode={rootPickerDisplayMode}
							songKey={songKey}
						/>
						<NotePicker entries={notePickerEntries} onToggle={handleNoteToggle} />
						<NoteSearch entries={noteSearchEntries} onToggle={handleNoteSearchToggle} />
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

						{hasPendingInsertTarget ? undefined : (
							<div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-3 text-sm text-amber-200">
								{t(
									"song.insertChordMissingTarget",
									"Open this picker from a lyrics field to insert the selected chord.",
								)}
							</div>
						)}

						<div
							className="grid grid-cols-1 gap-2 min-[900px]:grid-cols-2"
							data-testid="chord-shape-results"
						>
							{displayedShapes.length === EMPTY_SHAPE_COUNT &&
							allShapeInversions.length === EMPTY_SHAPE_COUNT ? (
								<div className="rounded-lg border border-dashed border-gray-700 px-3 py-4 text-sm text-gray-400">
									{t("song.chordNoResults", "No chord shapes match this search.")}
								</div>
							) : (
								<>
									{displayedShapes.map((shape) => {
										const noteSearchMatchRoot = getNoteSearchRoot(shape.spelling);
										const cardRoot =
											noteSearchMatchRoot === undefined
												? selectedRoot
												: {
														root: noteSearchMatchRoot,
														rootType: "absolute" as const,
														label: noteSearchMatchRoot,
													};
										return (
											<ChordSearchResultCard
												key={shape.id}
												shape={shape}
												isSelected={isShapeSelected(shape.id)}
												onSelect={setSelectedShapeCode}
												selectedRoot={cardRoot}
												chordDisplayMode={chordDisplayMode}
												songKey={songKey}
												inversionInfo={directShapeOrdinals.get(shape.code)}
											/>
										);
									})}
									{allShapeInversions.map(
										({ inversion, sourceShapeCode, sourceShapeName, displayToken }) => (
											<button
												key={`inv-${sourceShapeCode}-${inversion.bassRoot}-${String(inversion.inversionNumber)}`}
												type="button"
												className={`w-full rounded-xl border px-4 py-3 text-left transition ${
													selectedBassNote === inversion.bassRoot
														? "border-blue-400 bg-blue-500/20 text-white"
														: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
												}`}
												data-testid={`chord-inversion-result-${sourceShapeCode}-${String(inversion.inversionNumber)}`}
												onClick={() => {
													handleSelectShapeInversion(sourceShapeCode, inversion);
												}}
											>
												<div className="min-w-0">
													<div className="flex items-center justify-between gap-3">
														<div className="min-w-0 font-medium">
															<span className="font-mono text-base">{displayToken}</span>
															<span className="px-1 text-gray-500">•</span>
															{inversion.matchedShape?.name ?? sourceShapeName}
														</div>
														<span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
															{inversion.ordinalLabel}
														</span>
													</div>
													<div className="mt-1 text-sm text-gray-400">
														{formatAccidentals(preferSharpIntervals(inversion.reRootedSpelling))}
													</div>
												</div>
											</button>
										),
									)}
								</>
							)}
						</div>
						<Button size="compact" variant="outlineSecondary" onClick={closeChordPicker}>
							{t("common.cancel", "Cancel")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
