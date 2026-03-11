import { cleanup, render, renderHook } from "@testing-library/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import useGridDragAndDrop from "./useGridDragAndDrop";

const SLIDE_IDS = ["s1", "s2", "s3"];
const ACTIVE_INDEX = 0;
const OVER_INDEX = 2;

describe("useGridDragAndDrop — Harness", () => {
	it("harness renders and exposes sensors, handleDragEnd, sortableItems", () => {
		cleanup();
		const setSlidesOrder = vi.fn();

		function Harness(): ReactElement {
			const { sensors, handleDragEnd, sortableItems } = useGridDragAndDrop({
				slideIds: SLIDE_IDS,
				setSlidesOrder,
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
									active: { id: SLIDE_IDS[ACTIVE_INDEX] },
									over: { id: SLIDE_IDS[OVER_INDEX] },
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
		expect(getByTestId("items").textContent).toBe("s1,s2,s3");
	});
});

describe("useGridDragAndDrop — renderHook", () => {
	it("sortableItems matches slideIds", () => {
		const setSlidesOrder = vi.fn();

		const { result } = renderHook(() =>
			useGridDragAndDrop({ slideIds: SLIDE_IDS, setSlidesOrder }),
		);

		expect(result.current.sortableItems).toStrictEqual(SLIDE_IDS);
	});

	it("handleDragEnd reorders when active and over differ", () => {
		const setSlidesOrder = vi.fn();

		const { result } = renderHook(() =>
			useGridDragAndDrop({ slideIds: SLIDE_IDS, setSlidesOrder }),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({
				active: { id: "s1" },
				over: { id: "s3" },
			}),
		);

		expect(setSlidesOrder).toHaveBeenCalledWith(["s2", "s3", "s1"]);
	});

	it("handleDragEnd does nothing when over is undefined", () => {
		const setSlidesOrder = vi.fn();

		const { result } = renderHook(() =>
			useGridDragAndDrop({ slideIds: SLIDE_IDS, setSlidesOrder }),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({ active: { id: "s1" }, over: undefined }),
		);

		expect(setSlidesOrder).not.toHaveBeenCalled();
	});
});
