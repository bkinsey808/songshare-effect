import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import Button from "@/react/lib/design-system/Button";
import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import { transformChordTextForDisplay } from "@/shared/music/chord-display";
import {
	getChordShapeByCode,
	searchChordShapes,
} from "@/shared/music/chord-shapes";
import type { SongKey } from "@/shared/song/songKeyOptions";

import {
	formatSelectedRootLabel,
	getCanonicalToken,
	getInitialMaxNotes,
	getInitialSelectedRoot,
	getInitialShapeCode,
	getRootRows,
	type SelectedRoot,
} from "./chordPickerRootOptions";
import useSongKeyPicker from "../song-key-picker/useSongKeyPicker";
const DYAD_NOTE_COUNT = 2;
const TRIAD_NOTE_COUNT = 3;
const TETRAD_NOTE_COUNT = 4;
const FIVE_NOTE_COUNT = 5;
const SIX_NOTE_COUNT = 6;
const SEVEN_NOTE_COUNT = 7;
const EIGHT_NOTE_COUNT = 8;
const EMPTY_SHAPE_COUNT = 0;
const FIRST_SHAPE_INDEX = 0;
const MAX_NOTE_OPTIONS = [
	DYAD_NOTE_COUNT,
	TRIAD_NOTE_COUNT,
	TETRAD_NOTE_COUNT,
	FIVE_NOTE_COUNT,
	SIX_NOTE_COUNT,
	SEVEN_NOTE_COUNT,
	EIGHT_NOTE_COUNT,
] as const;

type ChordPickerPageProps = Readonly<{
	songKey: SongKey | "";
	hasPendingInsertTarget: boolean;
	initialChordToken?: string;
	isEditingChord?: boolean;
	closeChordPicker: () => void;
	insertChordFromPicker: (token: string) => void;
}>;

function ChordPickerPage({
	songKey,
	hasPendingInsertTarget,
	initialChordToken,
	isEditingChord = false,
	closeChordPicker,
	insertChordFromPicker,
}: ChordPickerPageProps): ReactElement {
	const { t } = useTranslation();
	const { chordDisplayMode } = useChordDisplayModePreference();
	const [selectedRoot, setSelectedRoot] = useState<SelectedRoot>(() =>
		getInitialSelectedRoot({
			chordDisplayMode,
			initialChordToken,
			songKey,
		}),
	);
	const [query, setQuery] = useState("");
	const [maxNotes, setMaxNotes] = useState(() =>
		getInitialMaxNotes({
			initialChordToken,
		}),
	);
	const [selectedShapeCode, setSelectedShapeCode] = useState(() =>
		getInitialShapeCode({
			initialChordToken,
		}),
	);
	const rootInputId = useId();
	const searchInputId = useId();
	const maxNotesInputId = useId();
	const { containerRef, isOpen: isRootPickerOpen, setIsOpen: setIsRootPickerOpen } =
		useSongKeyPicker();
	const rootRows = getRootRows({
		chordDisplayMode,
		songKey,
	});
	const availableShapes = searchChordShapes({ query, maxNotes });
	const selectedShape =
		getChordShapeByCode(selectedShapeCode) ??
		availableShapes[FIRST_SHAPE_INDEX];
	const canonicalToken = getCanonicalToken({
		selectedRoot,
		selectedShapeCode: selectedShape?.code,
		songKey,
	});
	const previewToken =
		canonicalToken === undefined
			? ""
			: transformChordTextForDisplay(canonicalToken, {
					chordDisplayMode,
					songKey,
				});

	// Close the routed picker when Escape is pressed so keyboard users can cancel quickly.
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== "Escape") {
				return;
			}

			closeChordPicker();
		}

		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeChordPicker]);

	function handleInsert(): void {
		if (canonicalToken === undefined) {
			return;
		}

		insertChordFromPicker(canonicalToken);
	}

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
							<div className="mt-4">
								<ChordDisplayModeSelect className="flex-wrap" />
							</div>
						</div>
					</div>

					<div className="space-y-4 px-4 py-5 sm:px-6">
						<div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
							<div className="mt-2 grid gap-3 min-[520px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[520px]:items-start">
								<div className="min-w-0">
									<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
										{t("song.chordPreview", "Preview")}
									</div>
									<div className="mt-2 font-mono text-lg text-white">
										{previewToken === "" ? "—" : previewToken}
									</div>
								</div>
								<div className="min-w-0">
									<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
										{selectedShape === undefined
											? "—"
											: `${selectedShape.name} · ${selectedShape.spelling}`}
									</div>
									{selectedShape?.altNames === "" ? undefined : (
										<div className="mt-2 text-sm text-gray-400">
											{selectedShape?.altNames}
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="grid gap-4 min-[520px]:grid-cols-2 min-[520px]:items-end">
							<div ref={containerRef} className="relative">
								<label className="flex flex-col gap-1 text-sm text-gray-300" htmlFor={rootInputId}>
									<span>{t("song.chordRoot", "Root")}</span>
									<button
										id={rootInputId}
										type="button"
										className="flex w-full items-center justify-between rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-left text-sm text-white transition hover:border-gray-500 hover:bg-gray-900"
										onClick={() => {
											setIsRootPickerOpen(!isRootPickerOpen);
										}}
										aria-expanded={isRootPickerOpen}
										aria-haspopup="dialog"
										data-testid="chord-root-select"
									>
										<span>
											{formatSelectedRootLabel({
												selectedRoot,
												chordDisplayMode,
												songKey,
											})}
										</span>
										<ChevronDownIcon
											className={`size-4 text-gray-300 transition ${isRootPickerOpen ? "rotate-180" : ""}`}
										/>
									</button>
								</label>

								{isRootPickerOpen ? (
									<div
										className="absolute z-20 mt-2 w-[16rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-700 bg-gray-950 p-3 shadow-2xl ring-1 ring-white/10"
										data-testid="chord-root-options"
									>
										<div className="space-y-2">
											{rootRows.map((row) => (
												<div
													key={`${row.primary.rootType}:${row.primary.root}`}
													className={
														row.secondary === undefined ? "grid grid-cols-1" : "grid grid-cols-2 gap-2"
													}
												>
													{renderRootButton({
														rootOption: row.primary,
														selectedRoot,
														setSelectedRoot: (nextRoot) => {
															setSelectedRoot(nextRoot);
															setIsRootPickerOpen(false);
														},
													})}
													{row.secondary === undefined
														? undefined
														: renderRootButton({
																rootOption: row.secondary,
																selectedRoot,
																setSelectedRoot: (nextRoot) => {
																	setSelectedRoot(nextRoot);
																	setIsRootPickerOpen(false);
																},
															})}
												</div>
											))}
										</div>
									</div>
								) : undefined}
							</div>

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
									{MAX_NOTE_OPTIONS.map((noteCount) => (
										<option key={noteCount} value={String(noteCount)}>
											{noteCount}
										</option>
									))}
								</select>
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
								placeholder={t(
									"song.chordSearchPlaceholder",
									"Search by name, code, or b3",
								)}
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

						<div className="space-y-2">
							{availableShapes.length === EMPTY_SHAPE_COUNT ? (
								<div className="rounded-lg border border-dashed border-gray-700 px-3 py-4 text-sm text-gray-400">
									{t("song.chordNoResults", "No chord shapes match this search.")}
								</div>
							) : (
								availableShapes.map((shape) => {
									const isSelected = selectedShape?.id === shape.id;
									const description =
										shape.altNames === "" ? shape.spelling : `${shape.spelling} • ${shape.altNames}`;

									return (
										<button
											key={shape.id}
											type="button"
											className={`w-full rounded-xl border px-4 py-3 text-left transition ${
												isSelected
													? "border-blue-400 bg-blue-500/20 text-white"
													: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
											}`}
											onClick={() => {
												setSelectedShapeCode(shape.code);
											}}
										>
											<div className="flex items-center justify-between gap-3">
												<div className="min-w-0">
													<div className="font-medium">{shape.name}</div>
													<div className="mt-1 text-sm text-gray-400">{description}</div>
												</div>
												<div className="shrink-0 font-mono text-sm text-blue-200">
													{shape.code}
												</div>
											</div>
										</button>
									);
								})
							)}
						</div>
					</div>

					<div className="sticky bottom-0 border-t border-gray-800 bg-gray-900/95 px-4 py-4 backdrop-blur sm:px-6">
						<div className="flex items-center gap-2">
							<Button
								size="compact"
								variant="primary"
								onClick={handleInsert}
								disabled={canonicalToken === undefined || !hasPendingInsertTarget}
								data-testid="confirm-insert-chord"
							>
								{isEditingChord
									? t("song.editChordConfirm", "Update")
									: t("song.insertChordConfirm", "Insert")}
							</Button>
							<Button size="compact" variant="outlineSecondary" onClick={closeChordPicker}>
								{t("common.cancel", "Cancel")}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function renderRootButton({
	rootOption,
	selectedRoot,
	setSelectedRoot,
}: Readonly<{
	rootOption: SelectedRoot;
	selectedRoot: SelectedRoot;
	setSelectedRoot: (nextRoot: SelectedRoot) => void;
}>): ReactElement {
	const isSelected =
		selectedRoot.root === rootOption.root && selectedRoot.rootType === rootOption.rootType;

	return (
		<button
			type="button"
			className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
				isSelected
					? "border-blue-400 bg-blue-500/20 text-white"
					: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
			}`}
			onClick={() => {
				setSelectedRoot(rootOption);
			}}
		>
			{rootOption.label}
		</button>
	);
}

export default ChordPickerPage;
