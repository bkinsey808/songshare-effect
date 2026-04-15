import { useTranslation } from "react-i18next";

import formatAccidentals from "@/react/music/intervals/formatAccidentals";
import preferSharpIntervals from "@/react/music/intervals/preferSharpIntervals";

type ChordPreviewProps = Readonly<{
	previewToken: string;
	alternatePreviewLabel: string;
	alternatePreviewToken: string;
	selectedShapeName: string | undefined;
	selectedShapeSpelling: string | undefined;
	selectedShapeAltNames: string;
	slashPreviewToken: string;
	slashPreviewShapeName: string;
}>;

/**
 * Renders the preview card for the current chord selection.
 *
 * @param previewToken - Display-mode preview of the current chord
 * @param alternatePreviewLabel - Label for the alternate notation preview column
 * @param alternatePreviewToken - Alternate-notation preview of the current chord
 * @param selectedShapeName - Human-friendly chord-shape name
 * @param selectedShapeSpelling - Chord-shape spelling summary
 * @param selectedShapeAltNames - Alternate chord-shape names
 * @param slashPreviewToken - Preview token for the slash-form (bass) display
 * @param slashPreviewShapeName - Human-friendly name for the slash-form shape
 * @returns Preview card element for the chord picker
 */
export default function ChordPreview({
	previewToken,
	alternatePreviewLabel,
	alternatePreviewToken,
	selectedShapeName,
	selectedShapeSpelling,
	selectedShapeAltNames,
	slashPreviewToken,
	slashPreviewShapeName,
}: ChordPreviewProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
			<div className="mt-2 grid gap-4 min-[640px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)] min-[640px]:items-start">
				<div className="min-w-0">
					<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
						{t("song.chordPreview", "Preview")}
					</div>
					<div className="mt-2 font-mono text-lg text-white">
						{previewToken === "" ? "—" : formatAccidentals(previewToken)}
					</div>
				</div>
				<div className="min-w-0">
					<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
						{alternatePreviewLabel}
					</div>
					<div
						className="mt-2 font-mono text-lg text-gray-300"
						data-testid="chord-alternate-form-preview"
					>
						{alternatePreviewToken === ""
							? "—"
							: formatAccidentals(alternatePreviewToken)}
					</div>
				</div>
				<div className="min-w-0">
					<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
						{selectedShapeName === undefined
							? "—"
							: `${selectedShapeName} · ${formatAccidentals(preferSharpIntervals(selectedShapeSpelling ?? ""))}`}
					</div>
					{selectedShapeAltNames === "" ? undefined : (
						<div className="mt-2 text-sm text-gray-400">{selectedShapeAltNames}</div>
					)}
					{slashPreviewToken !== "" && slashPreviewShapeName !== "" && (
						<div className="mt-2 font-mono text-sm text-blue-400">
							{formatAccidentals(slashPreviewToken)}
							<span className="font-sans"> · {slashPreviewShapeName}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
