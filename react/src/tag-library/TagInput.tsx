import { useEffect, useRef, useState } from "react";

import { ZERO } from "@/shared/constants/shared-constants";

import searchTagsRequest from "./searchTagsRequest";
import TagBadge from "./TagBadge";

const DEBOUNCE_DELAY_MS = 250;
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

type TagInputProps = Readonly<{
	value: readonly string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
}>;

/**
 * Tag input with autocomplete. Displays current tags as removable pill badges
 * and a text input for adding new tags. Autocomplete suggestions come from the
 * user's tag library via the search API.
 *
 * @param value - Current list of tag slugs
 * @param onChange - Called when the tag list changes
 * @param placeholder - Placeholder text for the text input
 * @returns A React element rendering the tag input
 */
export default function TagInput({
	value,
	onChange,
	placeholder = "Add tags…",
}: TagInputProps): ReactElement {
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

	function removeTag(slug: string): void {
		onChange(value.filter((existing) => existing !== slug));
	}

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
				const results = await searchTagsRequest(query);
				const filtered = results.filter((slug) => !value.includes(slug));
				setSuggestions(filtered);
				setIsOpen(filtered.length > ZERO);
			})();
		}, DEBOUNCE_DELAY_MS);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
		if (event.key === ENTER_KEY) {
			event.preventDefault();
			addTag(inputValue);
		} else if (event.key === ESCAPE_KEY) {
			setSuggestions([]);
			setIsOpen(false);
		}
	}

	function handleBlur(): void {
		addTag(inputValue);
	}

	return (
		<div className="space-y-2">
			{value.length > ZERO && (
				<div className="flex flex-wrap gap-1.5">
					{value.map((slug) => (
						<TagBadge
							key={slug}
							slug={slug}
							onRemove={(): void => {
								removeTag(slug);
							}}
						/>
					))}
				</div>
			)}
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					placeholder={placeholder}
					className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
				/>
				{isOpen && suggestions.length > ZERO && (
					<ul
						role="listbox"
						className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-gray-600 bg-gray-800 shadow-lg"
					>
						{suggestions.map((slug) => (
							<li key={slug}>
								<button
									type="button"
									onMouseDown={(event): void => {
										// Use mouseDown to fire before the input blur event.
										event.preventDefault();
										addTag(slug);
									}}
									className="flex w-full items-center gap-1.5 px-3 py-1.5 text-sm text-blue-300 hover:bg-gray-700"
								>
									{slug}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
