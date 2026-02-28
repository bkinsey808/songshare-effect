import useEventSearchInput from "./useEventSearchInput";

type EventSearchInputProps = {
	activeEventId: string | undefined;
	onSelect: (eventId: string) => void;
	disabled?: boolean;
	id?: string;
};

/**
 * Searchable dropdown used in the community manage UI for picking an event
 * from the user's personal library.
 *
 * The input shows an autocomplete list as the user types and allows clearing
 * the current selection.  It is fully controlled via props so the parent hook
 * manages the selected event id.
 *
 * @param activeEventId - currently selected event id (may be empty)
 * @param onSelect - callback invoked with the new event id when the user
 *   chooses an item or clears the field
 * @param disabled - optional flag to disable interactions
 * @param id - optional DOM id for the text input element
 * @returns React element for the event search control
 */
export default function EventSearchInput({
	activeEventId,
	onSelect,
	disabled = false,
	id = "community-manage-add-event-input",
}: EventSearchInputProps): ReactElement {
	const {
		EVENTS_NONE,
		searchQuery,
		isOpen,
		containerRef,
		inputRef,
		filteredEvents,
		activeEvent,
		handleSelectEvent,
		handleInputFocus,
		handleInputChange,
		handleClearSelection,
		inputDisplayValue,
	} = useEventSearchInput({ activeEventId, onSelect });

	return (
		<div className="flex flex-col gap-2 flex-1">
			<div className="relative" ref={containerRef}>
				<input
					id={id}
					ref={inputRef}
					type="text"
					value={inputDisplayValue}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					placeholder="Search events in your library..."
					autoComplete="off"
					disabled={disabled}
					className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
				/>

				{activeEvent !== undefined && searchQuery === "" ? (
					<button
						type="button"
						onClick={handleClearSelection}
						disabled={disabled}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700"
					>
						✕
					</button>
				) : undefined}

				{isOpen && !disabled ? (
					<div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-600 bg-gray-800 shadow-lg py-1">
						{filteredEvents.length > EVENTS_NONE ? (
							filteredEvents.map((entry) => {
								const isSelected = entry.event_id === activeEventId;
								const eventName = entry.event_public?.event_name;
								const displayName =
									eventName !== undefined && eventName !== "" ? eventName : entry.event_id;
								return (
									<button
										type="button"
										key={entry.event_id}
										onClick={() => {
											handleSelectEvent(entry);
										}}
										className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors ${
											isSelected ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
										}`}
									>
										<span className="font-medium">{displayName}</span>
										{entry.event_public?.event_slug !== undefined &&
											entry.event_public.event_slug !== "" && (
												<span className="text-xs opacity-70">{entry.event_public.event_slug}</span>
											)}
									</button>
								);
							})
						) : (
							<p className="px-3 py-2 text-sm text-gray-500">No events found in library.</p>
						)}
					</div>
				) : undefined}
			</div>
		</div>
	);
}
