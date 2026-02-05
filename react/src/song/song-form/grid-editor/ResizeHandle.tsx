type ResizeHandleProps = Readonly<{
	field: string;
	onStartResize: (field: string, clientX: number) => void;
	isResizing: boolean;
}>;

// top-level handler doesn't capture outer-scope values
function handleKeyDown(event: React.KeyboardEvent): void {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		// For keyboard users, we could implement arrow key resizing here
		// For now, just prevent default to avoid unintended actions
	}
}

/**
 * Visual handle used to initiate column resizing.
 *
 * @param field - The column field name being resized
 * @param onStartResize - Callback invoked with (field, clientX) when resize begins
 * @param isResizing - Whether a resize operation is active
 * @returns Button element used as a visual resize handle
 */
export default function ResizeHandle({
	field,
	onStartResize,
	isResizing,
}: ResizeHandleProps): ReactElement {
	function handleMouseDown(event: React.MouseEvent): void {
		event.preventDefault();
		onStartResize(field, event.clientX);
	}

	return (
		<button
			type="button"
			className={`absolute top-0 right-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-0 ring-2 transition-opacity hover:opacity-100 focus:opacity-100 focus:ring-blue-500 focus:outline-none ${
				isResizing ? "opacity-100" : ""
			}`}
			onMouseDown={handleMouseDown}
			onKeyDown={handleKeyDown}
			aria-label={`Resize ${field} column`}
			title={`Resize ${field} column`}
			style={{
				zIndex: 10,
			}}
		>
			{/* Visual indicator line */}
			<div className="h-full w-full bg-blue-400 opacity-50" />
		</button>
	);
}
