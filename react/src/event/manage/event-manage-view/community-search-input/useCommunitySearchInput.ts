import { useEffect, useRef, useState } from "react";

import type { CommunityEntry } from "@/react/community/community-types";

import useAppStore from "@/react/app-store/useAppStore";

const COMMUNITIES_NONE = 0;

type UseCommunitySearchInputArgs = {
	activeCommunityId: string | undefined;
	onSelect: (communityId: string) => void;
	excludeCommunityIds?: readonly string[];
};

export type UseCommunitySearchInputReturn = {
	COMMUNITIES_NONE: number;
	searchQuery: string;
	isOpen: boolean;
	containerRef: React.RefObject<HTMLDivElement | null>;
	inputRef: React.RefObject<HTMLInputElement | null>;
	filteredCommunities: readonly CommunityEntry[];
	activeCommunity: CommunityEntry | undefined;
	handleSelectCommunity: (entry: CommunityEntry) => void;
	handleInputFocus: () => void;
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleClearSelection: (event: React.MouseEvent<HTMLButtonElement>) => void;
	inputDisplayValue: string;
};

/**
 * Encapsulates state and interaction logic for the searchable community
 * input used in the event manager.
 *
 * @param args - hook arguments
 * @param args.activeCommunityId - id of the currently selected community
 * @param args.onSelect - callback invoked with the new community id when selected
 * @returns state, refs, filtered list, and event handlers
 */
export default function useCommunitySearchInput({
	activeCommunityId,
	onSelect,
	excludeCommunityIds,
}: UseCommunitySearchInputArgs): UseCommunitySearchInputReturn {
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Handle clicks outside to close dropdown
	useEffect(() => {
		function handleDocumentPointerDown(event: MouseEvent | TouchEvent): void {
			const container = containerRef.current;
			if (container === null || !(event.target instanceof Node)) {
				return;
			}
			if (!container.contains(event.target)) {
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

	const communities = useAppStore((state) => state.communities);

	const excludeSet = new Set(excludeCommunityIds);
	const availableCommunities = communities.filter((entry) => !excludeSet.has(entry.community_id));

	const activeCommunity = communities.find((entry) => entry.community_id === activeCommunityId);

	const inputDisplayValue = searchQuery === "" ? (activeCommunity?.name ?? "") : searchQuery;

	const filteredCommunities =
		searchQuery === ""
			? availableCommunities
			: availableCommunities.filter((entry) => {
					const query = searchQuery.toLowerCase();
					const nameMatch = entry.name.toLowerCase().includes(query);
					const slugMatch = entry.slug.toLowerCase().includes(query);
					const idMatch = entry.community_id.toLowerCase().includes(query);
					return nameMatch || slugMatch || idMatch;
				});

	function handleSelectCommunity(entry: CommunityEntry): void {
		onSelect(entry.community_id);
		setSearchQuery("");
		setIsOpen(false);
	}

	function handleInputFocus(): void {
		setIsOpen(true);
	}

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setSearchQuery(event.target.value);
		setIsOpen(true);
	}

	function handleClearSelection(_event: React.MouseEvent<HTMLButtonElement>): void {
		onSelect("");
		setSearchQuery("");
		setIsOpen(false);
	}

	return {
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
	};
}
