import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

import searchTagsEffect from "@/react/tag-library/searchTagsRequest";
import { ZERO } from "@/shared/constants/shared-constants";

const DEBOUNCE_DELAY_MS = 250;
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

export type UseTagInputReturn = {
	addTag: (slug: string) => void;
	handleBlur: () => void;
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
	inputValue: string;
	isOpen: boolean;
	removeTag: (slug: string) => void;
	suggestions: string[];
};

/**
 * State and handlers for the TagInput component.
 *
 * @param value - Current list of tag slugs
 * @param onChange - Called when the tag list changes
 * @returns Input state and event handlers
 */
export default function useTagInput(
	value: readonly string[],
	onChange: (tags: string[]) => void,
): UseTagInputReturn {
	const [inputValue, setInputValue] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Clear the debounce timer when the component unmounts.
	useEffect(
		() => (): void => {
			if (debounceRef.current !== undefined) {
				clearTimeout(debounceRef.current);
			}
		},
		[],
	);

	/**
	 * Normalizes and adds a tag slug to the list, then resets input state.
	 * No-ops if the slug is empty or already present.
	 *
	* @param slug - The raw tag slug to add
	* @returns void
	 */
	function addTag(slug: string): void {
		const normalized = slug.trim().toLowerCase();
		if (normalized === "" || value.includes(normalized)) {
			return;
		}
		onChange([...value, normalized]);
		setInputValue("");
		setSuggestions([]);
		setIsOpen(false);
		inputRef.current?.focus();
	}

	/**
	 * Removes a tag slug from the list.
	 *
	* @param slug - The tag slug to remove
	* @returns void
	 */
	function removeTag(slug: string): void {
		onChange(value.filter((existing) => existing !== slug));
	}

	/**
	 * Updates input value and debounces an autocomplete search.
	 * Clears suggestions immediately when the query is empty.
	 *
	* @param event - The input change event
	* @returns void
	 */
	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const query = event.target.value;
		setInputValue(query);
		if (debounceRef.current !== undefined) {
			clearTimeout(debounceRef.current);
		}
		if (query.trim() === "") {
			setSuggestions([]);
			setIsOpen(false);
			return;
		}
		debounceRef.current = setTimeout((): void => {
			void (async (): Promise<void> => {
				const results = await Effect.runPromise(searchTagsEffect(query));
				const filtered = results.filter((slug) => !value.includes(slug));
				setSuggestions(filtered);
				setIsOpen(filtered.length > ZERO);
			})();
		}, DEBOUNCE_DELAY_MS);
	}

	/**
	 * Adds the current input value on Enter; closes suggestions on Escape.
	 *
	* @param event - The keyboard event
	* @returns void
	 */
	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
		if (event.key === ENTER_KEY) {
			event.preventDefault();
			addTag(inputValue);
		} else if (event.key === ESCAPE_KEY) {
			setSuggestions([]);
			setIsOpen(false);
		}
	}

	/**
	* Adds the current input value when the input loses focus.
	*
	* @returns void
	 */
	function handleBlur(): void {
		addTag(inputValue);
	}

	return {
		addTag,
		handleBlur,
		handleInputChange,
		handleKeyDown,
		inputRef,
		inputValue,
		isOpen,
		removeTag,
		suggestions,
	};
}
