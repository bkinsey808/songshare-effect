import type { DragEndEvent } from "@dnd-kit/core";
import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import useSlideDragAndDrop from "./useSlideDragAndDrop";

const SLIDE_ORDER = ["s1", "s2", "s3"];
const ACTIVE_INDEX = 0;
const OVER_INDEX = 2;

describe("useSlideDragAndDrop — Harness", () => {
	it("harness renders and exposes sensors, handleDragEnd, sortableItems", () => {
		cleanup();
		const setSlideOrder = vi.fn();

		/**
		 * Test harness component exposing hook output for DOM assertions.
		 *
		 * @returns A small DOM fragment used by the test
		 */
		function Harness(): ReactElement {
			const { sensors, handleDragEnd, sortableItems } = useSlideDragAndDrop({
				slideOrder: SLIDE_ORDER,
				setSlideOrder,
			});
			return (
				<div data-testid="harness-root">
					<span data-testid="items">{sortableItems.join(",")}</span>
					<button
						type="button"
						data-testid="drag"
						onClick={() => {
							handleDragEnd(
								forceCast<DragEndEvent>({
									active: { id: `${SLIDE_ORDER[ACTIVE_INDEX]}-${ACTIVE_INDEX}` },
									over: { id: `${SLIDE_ORDER[OVER_INDEX]}-${OVER_INDEX}` },
								}),
							);
						}}
					>
						Drag
					</button>
					<span data-testid="sensor-count">{sensors.length}</span>
				</div>
			);
		}

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("items").textContent).toBe("s1-0,s2-1,s3-2");
	});
});

describe("useSlideDragAndDrop — renderHook", () => {
	it("sortableItems maps slide ids with index suffix", () => {
		const setSlideOrder = vi.fn();

		const { result } = renderHook(() =>
			useSlideDragAndDrop({ slideOrder: SLIDE_ORDER, setSlideOrder }),
		);

		expect(result.current.sortableItems).toStrictEqual(["s1-0", "s2-1", "s3-2"]);
	});

	it("handleDragEnd reorders when active and over differ", () => {
		const setSlideOrder = vi.fn();

		const { result } = renderHook(() =>
			useSlideDragAndDrop({ slideOrder: SLIDE_ORDER, setSlideOrder }),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({
				active: { id: "s1-0" },
				over: { id: "s3-2" },
			}),
		);

		expect(setSlideOrder).toHaveBeenCalledWith(["s2", "s3", "s1"]);
	});

	it("handleDragEnd does nothing when over is null", () => {
		const setSlideOrder = vi.fn();

		const { result } = renderHook(() =>
			useSlideDragAndDrop({ slideOrder: SLIDE_ORDER, setSlideOrder }),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({ active: { id: "s1-0" }, over: undefined }),
		);

		expect(setSlideOrder).not.toHaveBeenCalled();
	});
});
