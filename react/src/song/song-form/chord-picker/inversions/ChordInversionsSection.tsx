import { useTranslation } from "react-i18next";

import formatRomanDegree from "@/shared/music/chord-display/formatRomanDegree";
import { isSongKey, type SongKey } from "@/shared/song/songKeyOptions";
import {
	ChordDisplayCategory,
	type ChordDisplayCategoryType,
} from "@/shared/user/chord-display/chordDisplayCategory";

import preferSharpIntervals from "../preferSharpIntervals";
import formatChordSearchDisplayText from "../result-card/formatChordSearchDisplayText";
import type { ChordInversion } from "../use-chord-picker/getChordInversions";

const EMPTY_INVERSIONS_COUNT = 0;

type ChordInversionsSectionProps = Readonly<{
	inversions: readonly ChordInversion[];
	/** Human-friendly name of the original chord shape, e.g. "Major" */
	originalShapeName: string;
	/** Current chord display category, used to show scale degree symbols */
	chordDisplayCategory: ChordDisplayCategoryType;
	/** Song key for roman-degree conversion, or empty string when not set */
	songKey: SongKey | "";
	/** Bass note of the currently selected inversion, or undefined for root position */
	selectedBassNote: SongKey | undefined;
	/** Display preview token (letter or scale degree) keyed by bass root */
	inversionPreviewTokens: ReadonlyMap<SongKey, string>;
	/** Slash-form preview token (original shape, no SCI matching) keyed by bass root */
	slashPreviewTokens: ReadonlyMap<SongKey, string>;
	/** Called when the user selects or deselects an inversion card */
	onSelectInversion: (inversion: ChordInversion) => void;
}>;

/**
 * Displays all voicing inversions for the currently selected chord as selectable cards.
 * Each card shows the slash chord symbol (e.g. C/E), original chord name, ordinal label,
 * optional matching SCI shape, and re-rooted interval spelling.
 *
 * @param inversions - Computed inversions for the active chord
 * @param originalShapeName - Name of the original chord shape shown in each card
 * @returns Inversions section with one card per inversion, or undefined when there are none
 */
export default function ChordInversionsSection({
	inversions,
	originalShapeName,
	chordDisplayCategory,
	songKey,
	selectedBassNote,
	inversionPreviewTokens,
	slashPreviewTokens,
	onSelectInversion,
}: ChordInversionsSectionProps): ReactElement | undefined {
	const { t } = useTranslation();
	const useScaleDegrees =
		chordDisplayCategory === ChordDisplayCategory.scaleDegree && isSongKey(songKey);

	function displayRoot(key: SongKey): string {
		if (!useScaleDegrees) {
			return key;
		}
		return formatRomanDegree(key, songKey);
	}

	if (inversions.length === EMPTY_INVERSIONS_COUNT) {
		return undefined;
	}

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium text-gray-300">{t("song.chordInversions", "Inversions")}</p>
			<div
				className="grid grid-cols-1 gap-2 min-[900px]:grid-cols-2"
				data-testid="chord-inversions"
			>
				{inversions.map((inversion) => {
					const description = formatChordSearchDisplayText(
						preferSharpIntervals(inversion.reRootedSpelling),
					);

					return (
						<button
							key={`${inversion.bassRoot}-${String(inversion.inversionNumber)}`}
							type="button"
							className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
								selectedBassNote === inversion.bassRoot
									? "border-blue-400 bg-blue-500/20 text-white"
									: "border-gray-700 bg-gray-900 text-gray-200 hover:border-blue-500 hover:bg-gray-800 active:bg-gray-700"
							}`}
							data-testid={`chord-inversion-${String(inversion.inversionNumber)}`}
							onClick={(): void => {
								onSelectInversion(inversion);
							}}
						>
							<div className="min-w-0">
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0 font-medium">
										<span className="font-mono text-base">
											{inversionPreviewTokens.get(inversion.bassRoot) ??
												`${displayRoot(inversion.originalRoot)}/${displayRoot(inversion.bassRoot)}`}
										</span>
										<span className="px-1 text-gray-500">•</span>
										{inversion.matchedShape === undefined
											? originalShapeName
											: inversion.matchedShape.name}
									</div>
									<span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
										{inversion.ordinalLabel}
									</span>
								</div>
								{inversion.matchedShape !== undefined &&
									inversion.matchedShape.name !== originalShapeName && (
										<div className="mt-1 text-sm text-blue-400">
											{slashPreviewTokens.get(inversion.bassRoot) ??
												`${displayRoot(inversion.originalRoot)}/${displayRoot(inversion.bassRoot)}`}{" "}
											• {originalShapeName}
										</div>
									)}
								<div className="mt-1 text-sm text-gray-400">{description}</div>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
