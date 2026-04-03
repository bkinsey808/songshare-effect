import { act, cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useSongKeyPicker from "./useSongKeyPicker";

const POINTER_DOWN_EVENT = "pointerdown";
const KEY_DOWN_EVENT = "keydown";
const ESCAPE_KEY = "Escape";
const NON_ESCAPE_KEY = "Enter";

/**
 * Harness for useSongKeyPicker.
 *
 * Demonstrates how the hook integrates with UI code:
 * - Attaches `containerRef` to the picker container so outside clicks can be detected
 * - Renders `isOpen` so tests can observe the picker state
 * - Wires buttons to `setIsOpen` for opening and closing the picker
 * - Provides an outside element to exercise click-outside behavior
 */
function Harness(): ReactElement {
	const { isOpen, setIsOpen, containerRef } = useSongKeyPicker();

	return (
		<div>
			<div ref={containerRef} data-testid="picker-container">
				<div data-testid="is-open">{String(isOpen)}</div>
				<button
					type="button"
					data-testid="open-picker"
					onClick={() => {
						setIsOpen(true);
					}}
				>
					open
				</button>
				<button
					type="button"
					data-testid="close-picker"
					onClick={() => {
						setIsOpen(false);
					}}
				>
					close
				</button>
			</div>
			<button type="button" data-testid="outside-target">
				outside
			</button>
		</div>
	);
}

describe("useSongKeyPicker — Harness", () => {
	it("renders the hook API and starts closed", () => {
		// cleanup() is required for Harness tests in this repo.
		cleanup();

		// Act
		const rendered = render(<Harness />);
		const harness = within(rendered.container);

		// Assert
		expect(harness.getByTestId("picker-container")).toBeTruthy();
		expect(harness.getByTestId("open-picker")).toBeTruthy();
		expect(harness.getByTestId("close-picker")).toBeTruthy();
		expect(harness.getByTestId("outside-target")).toBeTruthy();
		expect(harness.getByTestId("is-open").textContent).toBe("false");
	});

	it("closes the picker when the user presses Escape", () => {
		cleanup();

		// Arrange
		const rendered = render(<Harness />);
		const harness = within(rendered.container);

		fireEvent.click(harness.getByTestId("open-picker"));

		// Act
		fireEvent.keyDown(document, { key: ESCAPE_KEY });

		// Assert
		expect(harness.getByTestId("is-open").textContent).toBe("false");
	});

	it("closes the picker when the user clicks outside the container", () => {
		cleanup();

		// Arrange
		const rendered = render(<Harness />);
		const harness = within(rendered.container);

		fireEvent.click(harness.getByTestId("open-picker"));

		// Act
		fireEvent.pointerDown(harness.getByTestId("outside-target"));

		// Assert
		expect(harness.getByTestId("is-open").textContent).toBe("false");
	});
});

describe("useSongKeyPicker — renderHook", () => {
	it("returns closed state and a null container ref initially", () => {
		// Act
		const { result } = renderHook(() => useSongKeyPicker());

		// Assert
		expect(result.current.isOpen).toBe(false);
		expect(result.current.containerRef.current).toBeNull();
	});

	it("updates isOpen when setIsOpen is called directly", () => {
		const { result } = renderHook(() => useSongKeyPicker());

		// Act
		act(() => {
			result.current.setIsOpen(true);
		});

		// Assert
		expect(result.current.isOpen).toBe(true);
	});

	it("ignores non-Escape keydown events", () => {
		const { result } = renderHook(() => useSongKeyPicker());

		act(() => {
			result.current.setIsOpen(true);
		});

		// Act
		fireEvent.keyDown(document, { key: NON_ESCAPE_KEY });

		// Assert
		expect(result.current.isOpen).toBe(true);
	});

	it("removes document listeners when the hook unmounts", () => {
		const addEventListenerSpy = vi.spyOn(document, "addEventListener");
		const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		// Act
		const { unmount } = renderHook(() => useSongKeyPicker());
		unmount();

		// Assert
		expect(addEventListenerSpy).toHaveBeenCalledWith(POINTER_DOWN_EVENT, expect.any(Function));
		expect(addEventListenerSpy).toHaveBeenCalledWith(KEY_DOWN_EVENT, expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith(POINTER_DOWN_EVENT, expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith(KEY_DOWN_EVENT, expect.any(Function));

		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
	});
});
