import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useColumnResize from "./useColumnResize";

const FIELDS = ["lyrics", "chords"];
const DEFAULT_SLIDE_NAME_WIDTH = 144;
const DEFAULT_FIELD_WIDTH = 200;
const RESIZE_START_X_HARNESS = 100;
const RESIZE_START_X_RENDER_HOOK = 200;

describe("useColumnResize — Harness", () => {
	it("harness renders and exposes getColumnWidth, startResize, isResizing, totalWidth", () => {
		cleanup();

		/**
		 * Test harness that renders the hook consumer and exposes controls
		 * to interact with the resize handlers.
		 *
		 * @returns React element for the harness
		 */
		function Harness(): ReactElement {
			const { getColumnWidth, startResize, isResizing, totalWidth } = useColumnResize({
				fields: FIELDS,
			});
			return (
				<div data-testid="harness-root">
					<span data-testid="lyrics-width">{getColumnWidth("lyrics")}</span>
					<span data-testid="resizing">{String(isResizing)}</span>
					<span data-testid="total">{totalWidth}</span>
					<button
						type="button"
						data-testid="start"
						onClick={() => {
							startResize("lyrics", RESIZE_START_X_HARNESS);
						}}
					>
						Resize
					</button>
				</div>
			);
		}

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("lyrics-width").textContent).toBe(String(DEFAULT_FIELD_WIDTH));
		expect(getByTestId("resizing").textContent).toBe("false");
		expect(getByTestId("total").textContent).toBe(
			String(DEFAULT_SLIDE_NAME_WIDTH + DEFAULT_FIELD_WIDTH * FIELDS.length),
		);
	});
});

describe("useColumnResize — renderHook", () => {
	it("getColumnWidth returns default for each field", () => {
		const { result } = renderHook(() => useColumnResize({ fields: FIELDS }));

		expect(result.current.getColumnWidth("lyrics")).toBe(DEFAULT_FIELD_WIDTH);
		expect(result.current.getColumnWidth("chords")).toBe(DEFAULT_FIELD_WIDTH);
	});

	it("totalWidth includes slide name column and all fields", () => {
		const { result } = renderHook(() => useColumnResize({ fields: FIELDS }));

		const expectedTotal = DEFAULT_SLIDE_NAME_WIDTH + DEFAULT_FIELD_WIDTH * FIELDS.length;
		expect(result.current.totalWidth).toBe(expectedTotal);
	});

	it("isResizing is false initially", () => {
		const { result } = renderHook(() => useColumnResize({ fields: FIELDS }));
		expect(result.current.isResizing).toBe(false);
	});

	it("startResize sets isResizing to true", async () => {
		const { result } = renderHook(() => useColumnResize({ fields: FIELDS }));

		result.current.startResize("lyrics", RESIZE_START_X_RENDER_HOOK);

		await waitFor(() => {
			expect(result.current.isResizing).toBe(true);
		});
	});
});
