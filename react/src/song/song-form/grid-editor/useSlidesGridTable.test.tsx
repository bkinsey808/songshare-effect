import type { DragEndEvent } from "@dnd-kit/core";
import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import useSlidesGridTable from "./useSlidesGridTable";

const FIELDS = ["lyrics", "display name"];
const SLIDE_ORDER = ["slide-1", "slide-2", "slide-1"];
const DEFAULT_FIELD_WIDTH = 300;
const SLIDE_NAME_WIDTH = 144;
const FIRST_DUPLICATE_GROUP_INDEX = 0;

type UseSlidesGridTableHookResult = RenderHookResult<
	ReturnType<typeof useSlidesGridTable>,
	undefined
>;

/**
 * Render the `useSlidesGridTable` hook with sensible defaults for tests.
 *
 * @returns The hook `result`, `rerender`, `unmount`, and a `setSlideOrder` spy
 */
function renderSlidesGridTableHook(): {
	result: UseSlidesGridTableHookResult["result"];
	rerender: UseSlidesGridTableHookResult["rerender"];
	unmount: UseSlidesGridTableHookResult["unmount"];
	setSlideOrder: ReturnType<typeof vi.fn>;
} {
	const setSlideOrder = vi.fn();
	const hook = renderHook(() =>
		useSlidesGridTable({
			fields: FIELDS,
			slideOrder: SLIDE_ORDER,
			setSlideOrder,
			defaultFieldWidth: DEFAULT_FIELD_WIDTH,
			slideNameWidth: SLIDE_NAME_WIDTH,
		}),
	);

	return {
		...hook,
		setSlideOrder,
	};
}

describe("useSlidesGridTable", () => {
	it("builds field width CSS variables for each field", () => {
		const { result } = renderSlidesGridTableHook();

		expect(result.current.fieldWidthVars).toStrictEqual({
			"field-display-name-width": "300px",
			"field-lyrics-width": "300px",
		});
	});

	it("tracks global dragging across drag lifecycle handlers", () => {
		const { result } = renderSlidesGridTableHook();

		act(() => {
			result.current.handleDragStart();
		});
		expect(result.current.globalIsDragging).toBe(true);

		act(() => {
			result.current.handleDragCancel();
		});
		expect(result.current.globalIsDragging).toBe(false);
	});

	it("clears dragging state and reorders slides on drag end", () => {
		const { result, setSlideOrder } = renderSlidesGridTableHook();

		act(() => {
			result.current.handleDragStart();
		});

		act(() => {
			result.current.handleDragEnd(
				forceCast<DragEndEvent>({
					active: { id: "slide-1" },
					over: { id: "slide-2" },
				}),
			);
		});

		expect(result.current.globalIsDragging).toBe(false);
		expect(setSlideOrder).toHaveBeenCalledWith(["slide-2", "slide-1", "slide-1"]);
	});

	it("groups duplicate slide ids", () => {
		const { result } = renderSlidesGridTableHook();

		expect(result.current.duplicateGroupBySlideId.get("slide-1")).toBe(
			FIRST_DUPLICATE_GROUP_INDEX,
		);
		expect(result.current.duplicateGroupBySlideId.has("slide-2")).toBe(false);
	});
});
