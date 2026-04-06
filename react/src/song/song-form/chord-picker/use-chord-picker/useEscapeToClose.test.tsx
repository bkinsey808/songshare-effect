import { cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useEscapeToClose from "./useEscapeToClose";

const HARNESS_TEST_ID = "harness";
const ESCAPE_KEY = "Escape";
const ENTER_KEY = "Enter";
const ONE_CALL = 1;
const ZERO_CALLS = 0;

/**
 * Harness for useEscapeToClose.
 *
 * Mounts the hook and exposes a stable DOM surface so
 * integration-level tests can document the hook's API.
 *
 * @param closeChordPicker - Callback passed through to the hook
 * @returns ReactElement
 */
function Harness({
	closeChordPicker,
}: Readonly<{ closeChordPicker: () => void }>): ReactElement {
	useEscapeToClose(closeChordPicker);
	return <div data-testid={HARNESS_TEST_ID} />;
}

describe("useEscapeToClose — Harness", () => {
	it("mounts and renders without errors", () => {
		// Arrange
		cleanup();
		const closeChordPicker = vi.fn();

		// Act
		const rendered = render(<Harness closeChordPicker={closeChordPicker} />);

		// Assert
		expect(within(rendered.container).getByTestId(HARNESS_TEST_ID)).toBeTruthy();
	});
});

describe("useEscapeToClose — renderHook", () => {
	it("calls closeChordPicker once when Escape is pressed", () => {
		// Arrange
		const closeChordPicker = vi.fn();

		// Act
		renderHook(() => {
			useEscapeToClose(closeChordPicker);
		});
		fireEvent.keyDown(document, { key: ESCAPE_KEY });

		// Assert
		expect(closeChordPicker).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("does not call closeChordPicker when Enter is pressed", () => {
		// Arrange
		const closeChordPicker = vi.fn();

		// Act
		renderHook(() => {
			useEscapeToClose(closeChordPicker);
		});
		fireEvent.keyDown(document, { key: ENTER_KEY });

		// Assert
		expect(closeChordPicker).toHaveBeenCalledTimes(ZERO_CALLS);
	});

	it("removes the keydown listener on unmount", () => {
		// Arrange
		const closeChordPicker = vi.fn();
		const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		// Act
		const { unmount } = renderHook(() => {
			useEscapeToClose(closeChordPicker);
		});
		unmount();

		// Assert
		expect(
			removeEventListenerSpy.mock.calls.some(
				([eventType]) => eventType === "keydown",
			),
		).toBe(true);

		removeEventListenerSpy.mockRestore();
	});
});
