import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import useLocale from "@/react/lib/language/locale/useLocale";
import SlideNumberToggle from "@/react/slide-number/SlideNumberToggle";
import SlideOrientationToggle from "@/react/slide-orientation/SlideOrientationToggle";

/**
 * Card containing chord and slide display preferences.
 *
 * @returns The display settings card for chord and slide preferences.
 */
export default function DisplaySettingsCard(): ReactElement {
	const { t } = useLocale();

	return (
		<div className="rounded-lg bg-slate-800/50 px-3 py-2">
			<div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
				{t("navigation.displaySettings", "Display")}
			</div>
			<div className="flex flex-wrap items-center gap-3 sm:gap-5">
				<ChordDisplayModeSelect />
				<SlideOrientationToggle showLabel />
				<SlideNumberToggle />
			</div>
		</div>
	);
}
