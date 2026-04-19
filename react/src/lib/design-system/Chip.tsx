type ChipProps = Readonly<{
	children: React.ReactNode;
	onRemove?: (() => void) | undefined;
	removeAriaLabel?: string;
	className?: string;
}>;

/**
 * Renders a blue pill badge chip component for displaying tags, languages, chords,
 * and other categorical items. Supports an optional remove button.
 *
 * @param children - Content to display inside the chip
 * @param onRemove - Optional callback to remove the chip; shows × button when set
 * @param removeAriaLabel - Accessibility label for the remove button
 * @param className - Optional additional CSS classes to apply to the chip
 * @returns A React element rendering the chip badge
 */
export default function Chip({
	children,
	onRemove,
	removeAriaLabel = "Remove",
	className = "",
}: ChipProps): ReactElement {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border border-blue-700/40 bg-blue-900/40 px-2.5 py-0.5 text-sm font-medium text-blue-300 ring-1 ring-blue-700/40 ${className}`}
		>
			{children}
			{onRemove !== undefined && (
				<button
					type="button"
					onClick={onRemove}
					aria-label={removeAriaLabel}
					className="ml-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-700/40 hover:text-blue-200"
				>
					×
				</button>
			)}
		</span>
	);
}
