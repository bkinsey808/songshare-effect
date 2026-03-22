import useCommunitySearchInput from "./useCommunitySearchInput";

type CommunitySearchInputProps = {
	activeCommunityId: string | undefined;
	onSelect: (communityId: string) => void;
	disabled?: boolean;
	id?: string;
	excludeCommunityIds?: readonly string[];
};

/**
 * Searchable dropdown for picking a community from the user's joined/owned
 * communities. Used in the event manager to add a community link.
 *
 * @param activeCommunityId - currently selected community id
 * @param onSelect - callback invoked with the selected community id
 * @param disabled - optional flag to disable interactions
 * @param id - optional DOM id for the text input element
 * @returns React element for the community search control
 */
export default function CommunitySearchInput({
	activeCommunityId,
	onSelect,
	disabled = false,
	id = "event-manage-add-community-input",
	excludeCommunityIds,
}: CommunitySearchInputProps): ReactElement {
	const {
		COMMUNITIES_NONE,
		searchQuery,
		isOpen,
		containerRef,
		inputRef,
		filteredCommunities,
		activeCommunity,
		handleSelectCommunity,
		handleInputFocus,
		handleInputChange,
		handleClearSelection,
		inputDisplayValue,
	} = useCommunitySearchInput({
		activeCommunityId,
		onSelect,
		...(excludeCommunityIds === undefined ? {} : { excludeCommunityIds }),
	});

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
					placeholder="Search your communities..."
					autoComplete="off"
					disabled={disabled}
					className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
				/>

				{activeCommunity !== undefined && searchQuery === "" ? (
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
						{filteredCommunities.length > COMMUNITIES_NONE ? (
							filteredCommunities.map((entry) => {
								const isSelected = entry.community_id === activeCommunityId;
								return (
									<button
										type="button"
										key={entry.community_id}
										onClick={() => {
											handleSelectCommunity(entry);
										}}
										className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors ${
											isSelected ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
										}`}
									>
										<span className="font-medium">{entry.community_name}</span>
										<span className="text-xs opacity-70">{entry.community_slug}</span>
									</button>
								);
							})
						) : (
							<p className="px-3 py-2 text-sm text-gray-500">No communities found</p>
						)}
					</div>
				) : undefined}
			</div>
		</div>
	);
}
