import { useTranslation } from "react-i18next";

import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import Button from "@/react/lib/design-system/Button";
import type { SongKey } from "@/shared/song/songKeyOptions";

import SongKeyPicker from "../song-key-picker/SongKeyPicker";
import SciInversionsSection from "./inversions/ChordInversionsSection";
import NotePicker from "./note-picker/NotePicker";
import ChordPreview from "./preview/ChordPreview";
import ChordRootPicker from "./root-picker/ChordRootPicker";
import ChordSearchSection from "./search/ChordSearchSection";
import useChordPicker from "./use-chord-picker/useChordPicker";

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
		canonicalToken,
		chordDisplayCategory,
		chordInversions,
		inversionBaseShapeName,
		handleInsert,
		inversionPreviewTokens,
		inversionSlashPreviewTokens,
		slashPreviewToken,
		slashPreviewShapeName,
		previewShapeSpelling,
		absoluteRoot,
		handleNoteToggle,
		handleSelectInversion,
		handleSelectShapeInversion,
		inversionBaseShapeCode,
		selectedBassNote,
		shapeHighlightActive,
		notePickerEntries,
		previewToken,
		rootPickerDisplayMode,
		selectedRoot,
		selectedShape,
		selectedShapeCode,
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
						<ChordSearchSection
							initialChordToken={initialChordToken}
							absoluteRoot={absoluteRoot}
							selectedShapeCode={selectedShapeCode}
							songKey={songKey}
							rootPickerDisplayMode={rootPickerDisplayMode}
							selectedRoot={selectedRoot}
							setSelectedShapeCode={setSelectedShapeCode}
							selectedBassNote={selectedBassNote}
							inversionBaseShapeCode={inversionBaseShapeCode}
							handleSelectShapeInversion={handleSelectShapeInversion}
							shapeHighlightActive={shapeHighlightActive}
						/>

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
