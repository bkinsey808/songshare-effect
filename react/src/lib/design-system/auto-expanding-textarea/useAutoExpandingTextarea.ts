import { useEffect, useRef } from "react";

import syncTextareaHeight from "./syncTextareaHeight";

type UseAutoExpandingTextareaParams = Readonly<{
	value: string;
	minRows: number;
	maxRows: number;
	fillParentHeight: boolean;
	growWithContent: boolean;
	resizeOnExternalValueChange: boolean;
}>;

type UseAutoExpandingTextareaReturn = Readonly<{
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	handleFocus: () => void;
	handleInput: () => void;
}>;

/**
 * Owns textarea auto-resize lifecycle wiring for controlled textareas.
 *
 * Returns the ref and DOM event handlers needed to keep the textarea height in
 * sync with content, optional parent-height fill, and deferred external updates.
 *
 * @param value - current controlled textarea value
 * @param minRows - minimum visible row count to preserve
 * @param maxRows - maximum visible row count when growth is capped
 * @param fillParentHeight - whether the textarea should grow to at least its parent height
 * @param growWithContent - whether the textarea should ignore the max row cap
 * @param resizeOnExternalValueChange - whether non-focused controlled updates should resize immediately
 * @returns ref and handlers for wiring an auto-expanding textarea to the DOM
 */
export default function useAutoExpandingTextarea({
	value,
	minRows,
	maxRows,
	fillParentHeight,
	growWithContent,
	resizeOnExternalValueChange,
}: UseAutoExpandingTextareaParams): UseAutoExpandingTextareaReturn {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Keep the textarea height in sync with controlled value changes when this instance should resize immediately.
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea === null) {
			return;
		}

		if (!resizeOnExternalValueChange && textarea !== document.activeElement) {
			return;
		}

		syncTextareaHeight({ textarea, minRows, maxRows, fillParentHeight, growWithContent });
	}, [fillParentHeight, growWithContent, maxRows, minRows, resizeOnExternalValueChange, value]);

	// Let deferred mirrors catch up on page scroll so off-screen editors re-expand after the viewport moves.
	useEffect(() => {
		if (resizeOnExternalValueChange) {
			return;
		}

		/**
		 * Handle window scroll events to resize deferred textareas when needed.
		 * @returns void
		 */
		function handleScroll(): void {
			const textarea = textareaRef.current;
			if (textarea === null) {
				return;
			}

			syncTextareaHeight({ textarea, minRows, maxRows, fillParentHeight, growWithContent });
		}

		window.addEventListener("scroll", handleScroll, { passive: true });

		return (): void => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [fillParentHeight, growWithContent, maxRows, minRows, resizeOnExternalValueChange, value]);

	/**
	 * Handle textarea input events and keep height in sync with content.
	 * @returns void
	 */
	function handleInput(): void {
		const textarea = textareaRef.current;
		if (textarea === null) {
			return;
		}

		syncTextareaHeight({ textarea, minRows, maxRows, fillParentHeight, growWithContent });
	}

	/**
	 * Handle focus events to ensure the textarea is resized when focused.
	 * @returns void
	 */
	function handleFocus(): void {
		const textarea = textareaRef.current;
		if (textarea === null) {
			return;
		}

		syncTextareaHeight({ textarea, minRows, maxRows, fillParentHeight, growWithContent });
	}

	return {
		textareaRef,
		handleFocus,
		handleInput,
	};
}
