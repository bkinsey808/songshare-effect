import { useSortable } from "@dnd-kit/sortable";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import useSlidesGridRow, { type UseSlidesGridRowParams } from "./useSlidesGridRow";

const FIXED_COLUMN_COUNT = 2; // matches constant in hook

vi.mock("@dnd-kit/sortable");

vi.mocked(useSortable).mockReturnValue(
	forceCast<ReturnType<typeof useSortable>>({
		attributes: { role: "button" },
		listeners: { onPointerDown: vi.fn() },
		setNodeRef: vi.fn(),
		transform: undefined,
		transition: "",
		isDragging: false,
	}),
);

type Params = UseSlidesGridRowParams;

 

/**
 * Create default `UseSlidesGridRow` params for tests.
 *
 * @param overrides - Partial overrides to the default params
 * @returns A fully populated params object for the hook
 */
function makeParams(overrides: Partial<Params> = {}): Params {
	return {
		slideId: "slide-1",
		slideOrder: ["slide-1"],
		fields: ["field-a", "field-b"],
		globalIsDragging: false,
		...overrides,
	};
}

describe("useSlidesGridRow — initial state", () => {
	it("confirmingDelete starts as false", () => {
		const { result } = renderHook(() => useSlidesGridRow(makeParams()));
		expect(result.current.confirmingDelete).toBe(false);
	});
});

describe("useSlidesGridRow — isSingleInstance", () => {
	it("is true when slideId appears once in slideOrder", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(makeParams({ slideOrder: ["slide-1", "slide-2"] })),
		);
		expect(result.current.isSingleInstance).toBe(true);
	});

	it("is false when slideId appears more than once in slideOrder", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(
				makeParams({ slideOrder: ["slide-1", "slide-2", "slide-1"] }),
			),
		);
		expect(result.current.isSingleInstance).toBe(false);
	});

	it("is false when slideId does not appear in slideOrder", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(
				makeParams({ slideId: "slide-1", slideOrder: ["slide-2"] }),
			),
		);
		expect(result.current.isSingleInstance).toBe(false);
	});
});

describe("useSlidesGridRow — totalColumns", () => {
	it("equals FIXED_COLUMN_COUNT plus fields length", () => {
		const fields = ["a", "b", "c"];
		const { result } = renderHook(() => useSlidesGridRow(makeParams({ fields })));
		expect(result.current.totalColumns).toBe(FIXED_COLUMN_COUNT + fields.length);
	});

	it("equals FIXED_COLUMN_COUNT when fields is empty", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(makeParams({ fields: [] })),
		);
		expect(result.current.totalColumns).toBe(FIXED_COLUMN_COUNT);
	});

	it("equals FIXED_COLUMN_COUNT when fields is undefined and logs error", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
			/* noop */
		});

		const { result } = renderHook(() =>
			useSlidesGridRow(makeParams({ fields: undefined })),
		);

		expect(result.current.totalColumns).toBe(FIXED_COLUMN_COUNT);
		expect(consoleSpy).toHaveBeenCalledWith(
			"SortableGridRow: unexpected fields value (expected array)",
			{ fields: undefined },
		);

		consoleSpy.mockRestore();
	});
});

describe("useSlidesGridRow — faded", () => {
	it("is false initially when not confirming delete", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(makeParams({ globalIsDragging: true })),
		);
		expect(result.current.faded).toBe(false);
	});

	it("is true when single instance, confirming delete, and global is dragging", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(
				makeParams({ slideOrder: ["slide-1"], globalIsDragging: true }),
			),
		);

		act(() => {
			result.current.setConfirmingDelete(true);
		});

		expect(result.current.faded).toBe(true);
	});

	it("is false when single instance, confirming delete, but not dragging", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(
				makeParams({ slideOrder: ["slide-1"], globalIsDragging: false }),
			),
		);

		act(() => {
			result.current.setConfirmingDelete(true);
		});

		expect(result.current.faded).toBe(false);
	});

	it("is false when not single instance even when confirming and dragging", () => {
		const { result } = renderHook(() =>
			useSlidesGridRow(
				makeParams({
					slideOrder: ["slide-1", "slide-2", "slide-1"],
					globalIsDragging: true,
				}),
			),
		);

		act(() => {
			result.current.setConfirmingDelete(true);
		});

		expect(result.current.faded).toBe(false);
	});
});

describe("useSlidesGridRow — setConfirmingDelete", () => {
	it("updates confirmingDelete to true", () => {
		const { result } = renderHook(() => useSlidesGridRow(makeParams()));

		act(() => {
			result.current.setConfirmingDelete(true);
		});

		expect(result.current.confirmingDelete).toBe(true);
	});

	it("updates confirmingDelete back to false", () => {
		const { result } = renderHook(() => useSlidesGridRow(makeParams()));

		act(() => {
			result.current.setConfirmingDelete(true);
		});
		act(() => {
			result.current.setConfirmingDelete(false);
		});

		expect(result.current.confirmingDelete).toBe(false);
	});
});

describe("useSlidesGridRow — dnd-kit passthrough", () => {
	it("exposes attributes, listeners, setNodeRef, transform, transition, isDragging from useSortable", () => {
		const { result } = renderHook(() => useSlidesGridRow(makeParams()));

		expect(result.current.attributes).toBeDefined();
		expect(result.current.listeners).toBeDefined();
		expect(typeof result.current.setNodeRef).toBe("function");
		expect(result.current.transform).toBeUndefined();
		expect(result.current.transition).toBe("");
		expect(result.current.isDragging).toBe(false);
	});
});
