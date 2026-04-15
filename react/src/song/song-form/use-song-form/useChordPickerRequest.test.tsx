import { act, cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useChordPickerRequest from "./useChordPickerRequest";

const CHORD_TOKEN = "Am";

/**
 * Harness for useChordPickerRequest.
 *
 * Shows how useChordPickerRequest integrates into a real UI:
 * - A status span showing whether a chord picker request is pending
 * - An "open" button that opens the chord picker with a given submitChord callback
 * - A "close" button that dismisses the picker without submitting
 * - An "insert" button that submits CHORD_TOKEN and closes the picker
 *
 * @param submitChord - Callback invoked when a chord is submitted
 * @returns A small DOM fragment used by harness tests
 */
function Harness({ submitChord }: { submitChord: (token: string) => void }): ReactElement {
	const { pendingChordPickerRequest, openChordPicker, closeChordPicker, insertChordFromPicker } =
		useChordPickerRequest();
	return (
		<div>
			<span data-testid="status">
				{pendingChordPickerRequest === undefined ? "none" : "pending"}
			</span>
			<button data-testid="open" onClick={() => { openChordPicker({ submitChord }); }}>
				open
			</button>
			<button data-testid="close" onClick={closeChordPicker}>
				close
			</button>
			<button data-testid="insert" onClick={() => { insertChordFromPicker(CHORD_TOKEN); }}>
				insert
			</button>
		</div>
	);
}

describe("useChordPickerRequest — Harness", () => {
	it("renders with no pending request initially", () => {
		// Arrange + Act
		cleanup();
		const rendered = render(<Harness submitChord={vi.fn()} />);

		// Assert — no Act: verifying initial render state only
		expect(within(rendered.container).getByTestId("status").textContent).toBe("none");
	});

	it("open sets pending and close clears it", () => {
		// Arrange
		cleanup();
		const rendered = render(<Harness submitChord={vi.fn()} />);

		// Act — cycle 1: open
		fireEvent.click(within(rendered.container).getByTestId("open"));

		// Assert
		expect(within(rendered.container).getByTestId("status").textContent).toBe("pending");

		// Act — cycle 2: close
		fireEvent.click(within(rendered.container).getByTestId("close"));

		// Assert
		expect(within(rendered.container).getByTestId("status").textContent).toBe("none");
	});

	it("insert calls submitChord with the token and clears pending", () => {
		// Arrange
		cleanup();
		const submitChord = vi.fn();
		const rendered = render(<Harness submitChord={submitChord} />);
		fireEvent.click(within(rendered.container).getByTestId("open"));

		// Act
		fireEvent.click(within(rendered.container).getByTestId("insert"));

		// Assert
		expect(submitChord).toHaveBeenCalledWith(CHORD_TOKEN);
		expect(within(rendered.container).getByTestId("status").textContent).toBe("none");
	});
});

describe("useChordPickerRequest — renderHook", () => {
	it("starts with no pending request", () => {
		// Arrange + Act
		const { result } = renderHook(() => useChordPickerRequest());

		// Assert — no Act: verifying initial render state only
		expect(result.current.pendingChordPickerRequest).toBeUndefined();
	});

	it("openChordPicker sets the pending request", () => {
		// Arrange
		const { result } = renderHook(() => useChordPickerRequest());
		const request = { submitChord: vi.fn() };

		// Act
		act(() => {
			result.current.openChordPicker(request);
		});

		// Assert
		expect(result.current.pendingChordPickerRequest).toBe(request);
	});

	it("closeChordPicker clears the pending request", () => {
		// Arrange
		const { result } = renderHook(() => useChordPickerRequest());
		const request = { submitChord: vi.fn() };
		act(() => {
			result.current.openChordPicker(request);
		});

		// Act
		act(() => {
			result.current.closeChordPicker();
		});

		// Assert
		expect(result.current.pendingChordPickerRequest).toBeUndefined();
	});

	it("insertChordFromPicker calls submitChord with token and clears the request", () => {
		// Arrange
		const submitChord = vi.fn();
		const { result } = renderHook(() => useChordPickerRequest());
		act(() => {
			result.current.openChordPicker({ submitChord });
		});

		// Act
		act(() => {
			result.current.insertChordFromPicker(CHORD_TOKEN);
		});

		// Assert
		expect(submitChord).toHaveBeenCalledWith(CHORD_TOKEN);
		expect(result.current.pendingChordPickerRequest).toBeUndefined();
	});

	it("insertChordFromPicker is a no-op when no request is pending", () => {
		// Arrange
		const { result } = renderHook(() => useChordPickerRequest());

		// Act
		act(() => {
			result.current.insertChordFromPicker(CHORD_TOKEN);
		});

		// Assert
		expect(result.current.pendingChordPickerRequest).toBeUndefined();
	});
});
