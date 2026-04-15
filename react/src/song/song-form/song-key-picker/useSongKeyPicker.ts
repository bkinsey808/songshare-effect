import { useEffect, useRef, useState } from "react";

type UseSongKeyPickerReturn = {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	containerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Manages song-key picker open state and closes the popover on outside press or Escape.
 *
 * @returns Picker state and container ref used by the song key picker UI
 */
export default function useSongKeyPicker(): UseSongKeyPickerReturn {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Close the picker when the user clicks outside it or presses Escape.
	useEffect(() => {
		/**
		 * Close the picker when a pointerdown occurs outside the container.
		 *
		 * @param event - PointerEvent from the document
		 * @returns void
		 */
		function handlePointerDown(event: PointerEvent): void {
			if (!(event.target instanceof Node)) {
				return;
			}
			if (containerRef.current?.contains(event.target) !== true) {
				setIsOpen(false);
			}
		}

		/**
		 * Close the picker when the user presses the Escape key.
		 *
		 * @param event - KeyboardEvent from the document
		 * @returns void
		 */
		function handleEscape(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleEscape);

		return (): void => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	return {
		isOpen,
		setIsOpen,
		containerRef,
	};
}
