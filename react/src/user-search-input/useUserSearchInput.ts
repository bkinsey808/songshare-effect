import { useEffect, useRef, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import type { UserLibraryEntry } from "@/react/user-library/slice/user-library-types";

const USERS_NONE = 0;

type UseUserSearchInputArgs = {
	activeUserId: string | undefined;
	onSelect: (userId: string) => void;
	excludeUserIds: readonly string[];
};

type UseUserSearchInputReturn = {
	USERS_NONE: number;
	searchQuery: string;
	isOpen: boolean;
	containerRef: React.RefObject<HTMLDivElement | null>;
	inputRef: React.RefObject<HTMLInputElement | null>;
	filteredUsers: readonly UserLibraryEntry[];
	activeUser: UserLibraryEntry | undefined;
	handleSelectUser: (entry: UserLibraryEntry) => void;
	handleInputFocus: () => void;
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleClearSelection: (event: React.MouseEvent<HTMLButtonElement>) => void;
	inputDisplayValue: string;
};

/**
 * Encapsulates state and handlers for the user search input.
 *
 * @param args - Hook arguments
 * @returns State, refs and handlers for the user picker UI
 */
export default function useUserSearchInput({
	activeUserId,
	onSelect,
	excludeUserIds,
}: UseUserSearchInputArgs): UseUserSearchInputReturn {
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Handle clicks outside the container to close the search dropdown
	useEffect(() => {
		function handleDocumentPointerDown(event: MouseEvent | TouchEvent): void {
			const container = containerRef.current;
			if (container === null) {
				return;
			}

			const targetNode = event.target;
			if (!(targetNode instanceof Node)) {
				return;
			}

			if (!container.contains(targetNode)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleDocumentPointerDown);
		document.addEventListener("touchstart", handleDocumentPointerDown);

		return (): void => {
			document.removeEventListener("mousedown", handleDocumentPointerDown);
			document.removeEventListener("touchstart", handleDocumentPointerDown);
		};
	}, []);

	const userLibraryEntries = useAppStore((state) => state.userLibraryEntries);
	const excludeSet = new Set(excludeUserIds);
	const usersArray: readonly UserLibraryEntry[] = Object.values(userLibraryEntries).filter(
		(entry): entry is UserLibraryEntry =>
			entry !== undefined &&
			typeof entry === "object" &&
			// oxlint-disable-next-line unicorn/no-null -- Object.values can yield null from record
			entry !== null &&
			"followed_user_id" in entry &&
			!excludeSet.has(entry.followed_user_id),
	);

	const activeUser =
		activeUserId === undefined || activeUserId === ""
			? undefined
			: usersArray.find((entry) => entry.followed_user_id === activeUserId);

	const trimmedQuery = searchQuery.trim().toLowerCase();
	const filteredUsers: readonly UserLibraryEntry[] =
		trimmedQuery === ""
			? usersArray
			: usersArray.filter((entry: UserLibraryEntry) => {
					// entry.owner_username may be null/undefined/empty; cast to
					// lowercase string only when actually present.
					const rawName = entry.owner_username;
					const username =
						rawName !== null && rawName !== undefined && rawName !== ""
							? rawName.toLowerCase()
							: "";
					const userId = entry.followed_user_id.toLowerCase();
					return username.includes(trimmedQuery) || userId.includes(trimmedQuery);
				});

	function handleSelectUser(entry: UserLibraryEntry): void {
		// Close dropdown and clear search first
		setIsOpen(false);
		setSearchQuery("");

		// Call onSelect immediately after state updates
		onSelect(entry.followed_user_id);
	}

	function handleInputFocus(): void {
		setIsOpen(true);
	}

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setSearchQuery(event.target.value);
		setIsOpen(true);
	}

	function handleClearSelection(event: React.MouseEvent<HTMLButtonElement>): void {
		event.preventDefault();
		event.stopPropagation();
		onSelect("");
		setSearchQuery("");
		setIsOpen(false);
		inputRef.current?.focus();
	}

	// When searchQuery is empty we show either the active user's username or
	// their id.  We explicitly guard against null/undefined/empty username so
	// that we never render an unexpected falsy value in the input.
	let inputDisplayValue = "";
	if (searchQuery !== "") {
		inputDisplayValue = searchQuery;
	} else if (activeUser === undefined) {
		inputDisplayValue = "";
	} else if (
		activeUser.owner_username !== null &&
		activeUser.owner_username !== undefined &&
		activeUser.owner_username !== ""
	) {
		inputDisplayValue = activeUser.owner_username;
	} else {
		inputDisplayValue = activeUser.followed_user_id;
	}

	// inputDisplayValue is what shows inside the text input.  We prefer a
	// friendly username when available and fall back to the raw id.
	return {
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
	};
}
