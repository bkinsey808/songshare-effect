import type { SongKey } from "@/shared/song/songKeyOptions";

type SongKeyButtonProps = Readonly<{
	songKey: SongKey;
	selectedValue: SongKey | "";
	onChange: (value: SongKey | "") => void;
}>;

/**
 * Renders a selectable button for a single musical key option.
 *
 * @param songKey - Key represented by this button
 * @param selectedValue - Currently selected key value
 * @param onChange - Called when this key is selected
 * @returns Button element for the song key picker grid
 */
export default function SongKeyButton({
	songKey,
	selectedValue,
	onChange,
}: SongKeyButtonProps): ReactElement {
	const isSelected = selectedValue === songKey;

	return (
		<button
			type="button"
			className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
				isSelected
					? "border-blue-400 bg-blue-500/20 text-white"
					: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
			}`}
			onClick={() => {
				onChange(songKey);
			}}
		>
			{songKey.replaceAll("#", "♯").replaceAll("b", "♭")}
		</button>
	);
}
