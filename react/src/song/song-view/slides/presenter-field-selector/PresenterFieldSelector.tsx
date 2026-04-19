import { useTranslation } from "react-i18next";

import Button from "@/react/lib/design-system/Button";
import {
	ChordDisplayMode,
	type ChordDisplayModeType,
} from "@/shared/user/chord-display/effectiveChordDisplayMode";

import getFieldLabel from "./getFieldLabel";

const NO_FIELDS_COUNT = 0;

const CHORD_MODE_LABELS: Record<ChordDisplayModeType, string> = {
	[ChordDisplayMode.letters]: "Letter",
	[ChordDisplayMode.roman]: "Roman",
	[ChordDisplayMode.solfege]: "Solfege",
	[ChordDisplayMode.sargam]: "Sargam",
	[ChordDisplayMode.german]: "German",
};

const CHORD_DISPLAY_MODES: ChordDisplayModeType[] = [
	ChordDisplayMode.letters,
	ChordDisplayMode.roman,
	ChordDisplayMode.solfege,
	ChordDisplayMode.sargam,
	ChordDisplayMode.german,
];

type PresenterFieldSelectorProps = Readonly<{
	availableFields: readonly string[];
	selectedFields: readonly string[];
	showChords: boolean;
	chordDisplayMode: ChordDisplayModeType;
	showLanguageTags: boolean;
	onToggleField: (field: string) => void;
	onToggleChords: () => void;
	onSetChordDisplayMode: (mode: ChordDisplayModeType) => void;
	onToggleLanguageTags: () => void;
}>;

/**
 * Presenter selection panel for choosing which fields and annotations to display.
 *
 * Shows toggle buttons for each available slide field, a chord display mode
 * selector (including an Off option), and a language annotation toggle. Hidden
 * when there are no available fields.
 *
 * @param availableFields - All field keys available for the current song
 * @param selectedFields - Currently selected subset of field keys
 * @param showChords - Whether chord annotations are enabled
 * @param chordDisplayMode - Active chord notation system
 * @param showLanguageTags - Whether language tag annotations are enabled
 * @param onToggleField - Called with the field key to toggle in or out
 * @param onToggleChords - Called to toggle chord annotation visibility
 * @param onSetChordDisplayMode - Called with the new chord display mode
 * @param onToggleLanguageTags - Called to toggle language annotation visibility
 * @returns Presenter options panel element, or undefined when no fields exist
 */
export default function PresenterFieldSelector({
	availableFields,
	selectedFields,
	showChords,
	chordDisplayMode,
	showLanguageTags,
	onToggleField,
	onToggleChords,
	onSetChordDisplayMode,
	onToggleLanguageTags,
}: PresenterFieldSelectorProps): ReactElement | undefined {
	const { t } = useTranslation();

	if (availableFields.length === NO_FIELDS_COUNT) {
		return undefined;
	}

	return (
		<div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 space-y-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
				{t("presenter.options", "Presenter Options")}
			</p>

			{/* Field toggles */}
			<div className="space-y-1.5">
				<p className="text-xs text-gray-500">{t("presenter.fields", "Fields")}</p>
				<div className="flex flex-wrap gap-1.5">
					{availableFields.map((field) => {
						const isSelected = selectedFields.includes(field);
						return (
							<Button
								key={field}
								variant={isSelected ? "secondary" : "outlineSecondary"}
								size="compact"
								onClick={() => {
									onToggleField(field);
								}}
								aria-pressed={isSelected}
							>
								{getFieldLabel(field)}
							</Button>
						);
					})}
				</div>
			</div>

			{/* Chord display */}
			<div className="space-y-1.5">
				<p className="text-xs text-gray-500">{t("presenter.chords", "Chords")}</p>
				<div className="flex flex-wrap gap-1.5">
					<Button
						variant={showChords ? "outlineSecondary" : "secondary"}
						size="compact"
						onClick={onToggleChords}
						aria-pressed={!showChords}
					>
						{t("presenter.chordsOff", "Off")}
					</Button>
					{showChords &&
						CHORD_DISPLAY_MODES.map((mode) => (
							<Button
								key={mode}
								variant={chordDisplayMode === mode ? "secondary" : "outlineSecondary"}
								size="compact"
								onClick={() => {
									onSetChordDisplayMode(mode);
								}}
								aria-pressed={chordDisplayMode === mode}
							>
								{CHORD_MODE_LABELS[mode]}
							</Button>
						))}
				</div>
			</div>

			{/* Language annotation toggle */}
			<div className="space-y-1.5">
				<p className="text-xs text-gray-500">
					{t("presenter.languageTags", "Language Annotations")}
				</p>
				<div className="flex gap-1.5">
					<Button
						variant={showLanguageTags ? "secondary" : "outlineSecondary"}
						size="compact"
						onClick={onToggleLanguageTags}
						aria-pressed={showLanguageTags}
					>
						{showLanguageTags
							? t("presenter.languageTagsOn", "On")
							: t("presenter.languageTagsOff", "Off")}
					</Button>
				</div>
			</div>
		</div>
	);
}
