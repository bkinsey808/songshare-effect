import { useEffect } from "react";

/**
 * Closes the chord picker when the Escape key is pressed.
 *
 * @param closeChordPicker - Callback to close the picker overlay
 */
export default function useEscapeToClose(closeChordPicker: () => void): void {
	// Close the picker when Escape is pressed so keyboard users can cancel quickly.
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key !== "Escape") {
				return;
			}

			closeChordPicker();
		}

		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeChordPicker]);
}
