import useUserSearchInput from "@/react/user-search-input/useUserSearchInput";

type UserSearchInputProps = {
	activeUserId: string | undefined;
	onSelect: (userId: string) => void;
	disabled?: boolean;
	label?: string;
};

/**
 * Searchable selector for choosing a user by username or user id.
 *
 * @param props - Component props
 * @returns User search input with dropdown suggestions
 */
export default function UserSearchInput({
	activeUserId,
	onSelect,
	disabled = false,
	label = "Invite User (username or id)",
}: UserSearchInputProps): ReactElement {
	const inputId = "event-manage-invite-user-input";
	const {
		USERS_NONE,
		searchQuery,
		isOpen,
		containerRef,
		inputRef,
		filteredUsers,
		activeUser,
		handleSelectUser,
		handleInputFocus,
		handleInputChange,
		handleClearSelection,
		inputDisplayValue,
	} = useUserSearchInput({ activeUserId, onSelect });

	return (
		<div className="flex flex-col gap-2">
			<label htmlFor={inputId} className="text-sm font-medium text-white">
				{label}
			</label>
			<div className="relative" ref={containerRef}>
				<input
					id={inputId}
					ref={inputRef}
					type="text"
					value={inputDisplayValue}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					placeholder="Search users by username or ID"
					autoComplete="off"
					disabled={disabled}
					className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-muted-foreground"
				/>

				{activeUser !== undefined && searchQuery === "" ? (
					<button
						type="button"
						onClick={handleClearSelection}
						disabled={disabled}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
					>
						Clear
					</button>
				) : undefined}

				{isOpen && !disabled ? (
					<div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
						{filteredUsers.length > USERS_NONE ? (
							filteredUsers.map((entry) => {
								const isSelected = entry.followed_user_id === activeUserId;
								const displayName =
									entry.owner_username !== null &&
									entry.owner_username !== undefined &&
									entry.owner_username !== ""
										? entry.owner_username
										: entry.followed_user_id;
								return (
									<button
										type="button"
										key={entry.followed_user_id}
										onClick={(): void => {
											handleSelectUser(entry);
										}}
										className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors ${
											isSelected ? "bg-primary/10 text-primary" : "text-primary hover:bg-muted"
										}`}
									>
										<span className="font-medium">{displayName}</span>
									</button>
								);
							})
						) : (
							<p className="px-3 py-2 text-sm text-muted-foreground">No users found.</p>
						)}
					</div>
				) : undefined}
			</div>
		</div>
	);
}
