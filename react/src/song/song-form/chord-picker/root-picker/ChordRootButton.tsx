type ChordRootButtonProps = Readonly<{
	isSelected: boolean;
	label: string;
	onSelect: () => void;
}>;

/**
 * Renders a selectable chord-root option inside the root picker grid.
 *
 * @param isSelected - Whether this option is currently selected
 * @param label - Display label for the root option
 * @param onSelect - Called when the option is chosen
 * @returns Button element for the chord-root picker
 */
export default function ChordRootButton({
	isSelected,
	label,
	onSelect,
}: ChordRootButtonProps): ReactElement {
	return (
		<button
			type="button"
			className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
				isSelected
					? "border-blue-400 bg-blue-500/20 text-white"
					: "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
			}`}
			onClick={onSelect}
		>
			{label}
		</button>
	);
}
