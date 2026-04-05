import { useId } from "react";
import { useTranslation } from "react-i18next";

import ChevronDownIcon from "@/react/lib/design-system/icons/ChevronDownIcon";
import useSongKeyPicker from "@/react/song/song-form/song-key-picker/useSongKeyPicker";
import type { SongKey } from "@/shared/song/songKeyOptions";
import type { ChordDisplayModeType } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import ChordRootButton from "./ChordRootButton";
import type { SelectedRoot } from "./chordPickerRootOptionTypes";
import formatSelectedRootLabel from "./formatSelectedRootLabel";
import getRootRows from "./getRootRows";

type ChordRootPickerProps = Readonly<{
	selectedRoot: SelectedRoot;
	setSelectedRoot: (nextRoot: SelectedRoot) => void;
	chordDisplayMode: ChordDisplayModeType;
	songKey: SongKey | "";
}>;

/**
 * Renders the root selector used by the chord picker for absolute and roman roots.
 *
 * @param selectedRoot - Currently selected root option
 * @param setSelectedRoot - Updates the selected root
 * @param chordDisplayMode - Active display mode that controls which root labels are shown
 * @param songKey - Current song key for root conversion and display
 * @returns Root picker control with popover options
 */
export default function ChordRootPicker({
	selectedRoot,
	setSelectedRoot,
	chordDisplayMode,
	songKey,
}: ChordRootPickerProps): ReactElement {
	const { t } = useTranslation();
	const rootInputId = useId();
	const {
		containerRef,
		isOpen: isRootPickerOpen,
		setIsOpen: setIsRootPickerOpen,
	} = useSongKeyPicker();
	const rootRows = getRootRows({
		chordDisplayMode,
		songKey,
	});

	return (
		<div ref={containerRef} className="relative min-[520px]:w-[16rem]">
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
								<ChordRootButton
									isSelected={
										selectedRoot.root === row.primary.root &&
										selectedRoot.rootType === row.primary.rootType
									}
									label={row.primary.label}
									onSelect={() => {
										setSelectedRoot(row.primary);
										setIsRootPickerOpen(false);
									}}
								/>
								{((): ReactElement | undefined => {
									const secondaryRoot = row.secondary;

									if (secondaryRoot === undefined) {
										return undefined;
									}

									return (
										<ChordRootButton
											isSelected={
												selectedRoot.root === secondaryRoot.root &&
												selectedRoot.rootType === secondaryRoot.rootType
											}
											label={secondaryRoot.label}
											onSelect={() => {
												setSelectedRoot(secondaryRoot);
												setIsRootPickerOpen(false);
											}}
										/>
									);
								})()}
							</div>
						))}
					</div>
				</div>
			) : undefined}
		</div>
	);
}
