import TagBadge from "@/react/tag/TagBadge";
import { ZERO } from "@/shared/constants/shared-constants";

import useTagInput from "./useTagInput";

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
	const {
		addTag,
		handleBlur,
		handleInputChange,
		handleKeyDown,
		inputRef,
		inputValue,
		isOpen,
		removeTag,
		suggestions,
	} = useTagInput(value, onChange);

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
