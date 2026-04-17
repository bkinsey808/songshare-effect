import { useEffect, useRef, useState } from "react";

import {
	findLanguageByTag,
	searchLanguages,
	type LanguageEntry,
} from "@/shared/language/translationLanguages";

type UseLanguagePickerProps = Readonly<{
	value: string | undefined;
	onChange: (code: string | undefined) => void;
	excludedCodes?: readonly string[];
}>;

const NO_SUGGESTIONS = 0;

export type UseLanguagePickerReturn = {
	isOpen: boolean;
	inputValue: string;
	suggestions: readonly LanguageEntry[];
	selectedEntry: LanguageEntry | undefined;
	containerRef: React.RefObject<HTMLDivElement | null>;
	searchRef: React.RefObject<HTMLInputElement | null>;
	handleToggle: () => void;
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	handleSelect: (entry: LanguageEntry) => void;
	handleClear: () => void;
};

/**
 * State and handlers for the LanguagePicker component.
 *
 * Manages open/close state, search query, result ranking, and selection.
 * Closes on outside pointer-down or Escape; auto-focuses the search input on open.
 *
 * @param value - Currently selected BCP 47 code, or undefined for none
 * @param onChange - Called with the new BCP 47 code, or undefined when cleared
 * @param excludedCodes - BCP 47 codes to hide from search results
 * @returns Picker state and event handlers
 */
export default function useLanguagePicker({
	value,
	onChange,
	excludedCodes = [],
}: UseLanguagePickerProps): UseLanguagePickerReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const containerRef = useRef<HTMLDivElement | null>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	const selectedEntry = value === undefined ? undefined : findLanguageByTag(value);
	const suggestions = searchLanguages(inputValue, excludedCodes);

	// Auto-focus search input when the picker opens.
	useEffect(() => {
		if (isOpen) {
			searchRef.current?.focus();
		}
	}, [isOpen]);

	// Close on outside pointer-down or Escape.
	useEffect(() => {
		/**
		 * Close picker when a pointer-down occurs outside the container.
		 *
		 * @param event - PointerEvent from the document
		 * @returns void
		 */
		function handlePointerDown(event: PointerEvent): void {
			if (!(event.target instanceof Node)) {
				return;
			}
			const isInsideContainer = containerRef.current?.contains(event.target) === true;
			if (isInsideContainer) {
				return;
			}
			setIsOpen(false);
			setInputValue("");
		}

		/**
		 * Close picker on Escape key.
		 *
		 * @param event - KeyboardEvent from the document
		 * @returns void
		 */
		function handleEscape(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				setIsOpen(false);
				setInputValue("");
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleEscape);
		return (): void => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	/**
	 * Toggle the picker open or closed.
	 *
	 * @returns void
	 */
	function handleToggle(): void {
		if (isOpen) {
			setInputValue("");
		}
		setIsOpen(!isOpen);
	}

	/**
	 * Update the search query as the user types.
	 *
	 * @param event - Input change event
	 * @returns void
	 */
	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setInputValue(event.target.value);
	}

	/**
	 * Select the top suggestion on Enter.
	 *
	 * @param event - Keyboard event from the search input
	 * @returns void
	 */
	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter" && suggestions.length > NO_SUGGESTIONS) {
			event.preventDefault();
			const [firstSuggestion] = suggestions;
			if (firstSuggestion !== undefined) {
				onChange(firstSuggestion.tag);
				setIsOpen(false);
				setInputValue("");
			}
		}
	}

	/**
	 * Confirm a language selection and close the picker.
	 *
	 * @param entry - The language entry chosen by the user
	 * @returns void
	 */
	function handleSelect(entry: LanguageEntry): void {
		onChange(entry.tag);
		setIsOpen(false);
		setInputValue("");
	}

	/**
	 * Clear the current selection (optional fields only).
	 *
	 * @returns void
	 */
	function handleClear(): void {
		onChange(undefined);
		setIsOpen(false);
		setInputValue("");
	}

	return {
		isOpen,
		inputValue,
		suggestions,
		selectedEntry,
		containerRef,
		searchRef,
		handleToggle,
		handleInputChange,
		handleKeyDown,
		handleSelect,
		handleClear,
	};
}
