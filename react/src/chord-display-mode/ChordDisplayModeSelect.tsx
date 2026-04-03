import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import useLocale from "@/react/lib/language/locale/useLocale";
import {
	ChordDisplayMode,
	coerceChordDisplayMode,
	type ChordDisplayModeType,
} from "@/shared/user/chordDisplayMode";

import useChordDisplayModePreference from "./useChordDisplayModePreference";
import useSetChordDisplayMode from "./useSetChordDisplayMode";

type ChordDisplayModeSelectProps = Readonly<{
	className?: string;
}>;

export default function ChordDisplayModeSelect({
	className = "",
}: ChordDisplayModeSelectProps): ReactElement | undefined {
	const currentUser = useCurrentUser();
	const { t } = useLocale();
	const { chordDisplayMode } = useChordDisplayModePreference();
	const setChordDisplayMode = useSetChordDisplayMode();

	if (currentUser === undefined) {
		return undefined;
	}

	function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		const nextChordDisplayMode: ChordDisplayModeType = coerceChordDisplayMode(event.target.value);
		void setChordDisplayMode(nextChordDisplayMode);
	}

	return (
		<label className={`flex items-center gap-2 text-sm text-gray-300 ${className}`.trim()}>
			<span>{t("chordDisplayMode.label", "Chords")}</span>
			<select
				className="rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
				value={chordDisplayMode}
				onChange={handleChange}
				aria-label={t("chordDisplayMode.label", "Chords")}
				data-testid="chord-display-mode-select"
			>
				<option value={ChordDisplayMode.roman}>
					{t("chordDisplayMode.roman", "Roman Numerals")}
				</option>
				<option value={ChordDisplayMode.letters}>
					{t("chordDisplayMode.letters", "Letters")}
				</option>
				<option value={ChordDisplayMode.solfege}>
					{t("chordDisplayMode.solfege", "Solfège")}
				</option>
				<option value={ChordDisplayMode.indian}>
					{t("chordDisplayMode.indian", "Indian")}
				</option>
				<option value={ChordDisplayMode.german}>
					{t("chordDisplayMode.german", "German")}
				</option>
			</select>
		</label>
	);
}
