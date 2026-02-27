import { useEffect, useRef, useState } from "react";
import type { EventLibraryEntry } from "@/react/event-library/event-library-types";
import useAppStore from "@/react/app-store/useAppStore";

const EVENTS_NONE = 0;

type UseEventSearchInputArgs = {
	activeEventId: string | undefined;
	onSelect: (eventId: string) => void;
};

export type UseEventSearchInputReturn = {
	EVENTS_NONE: number;
	searchQuery: string;
	isOpen: boolean;
	containerRef: React.RefObject<HTMLDivElement | null>;
	inputRef: React.RefObject<HTMLInputElement | null>;
	filteredEvents: readonly EventLibraryEntry[];
	activeEvent: EventLibraryEntry | undefined;
	handleSelectEvent: (entry: EventLibraryEntry) => void;
	handleInputFocus: () => void;
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleClearSelection: (event: React.MouseEvent<HTMLButtonElement>) => void;
	inputDisplayValue: string;
};

/**
 * Encapsulates state and handlers for the event search input.
 */
export default function useEventSearchInput({
	activeEventId,
	onSelect,
}: UseEventSearchInputArgs): UseEventSearchInputReturn {
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

	const eventLibraryEntries = useAppStore((state) => state.eventLibraryEntries);
	const eventsArray: readonly EventLibraryEntry[] = Object.values(eventLibraryEntries).filter(
		(entry): entry is EventLibraryEntry => entry !== undefined,
	);

	const activeEvent =
		activeEventId === undefined || activeEventId === ""
			? undefined
			: eventsArray.find((entry) => entry.event_id === activeEventId);

	const trimmedQuery = searchQuery.trim().toLowerCase();
	const filteredEvents: readonly EventLibraryEntry[] =
		trimmedQuery === ""
			? eventsArray
			: eventsArray.filter((entry) => {
					const name = entry.event_public?.event_name?.toLowerCase() ?? "";
					const slug = entry.event_public?.event_slug?.toLowerCase() ?? "";
					const id = entry.event_id.toLowerCase();
					return name.includes(trimmedQuery) || slug.includes(trimmedQuery) || id.includes(trimmedQuery);
				});

	function handleSelectEvent(entry: EventLibraryEntry): void {
		onSelect(entry.event_id);
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

	function handleClearSelection(event: React.MouseEvent<HTMLButtonElement>): void {
		event.preventDefault();
		event.stopPropagation();
		onSelect("");
		setSearchQuery("");
		setIsOpen(false);
		inputRef.current?.focus();
	}

	let inputDisplayValue = "";
	if (searchQuery !== "") {
		inputDisplayValue = searchQuery;
	} else if (activeEvent?.event_public?.event_name !== undefined && activeEvent.event_public.event_name !== "") {
		inputDisplayValue = activeEvent.event_public.event_name;
	} else if (activeEvent?.event_id !== undefined && activeEvent.event_id !== "") {
		inputDisplayValue = activeEvent.event_id;
	}

	return {
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
	};
}
