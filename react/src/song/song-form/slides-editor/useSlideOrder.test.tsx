import { renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import useSlideOrder from "./useSlideOrder";

function useControlledSlideOrder(initial: readonly string[]): ReturnType<typeof useSlideOrder> & {
	slideOrder: readonly string[];
	setSlideOrder: (value: readonly string[]) => void;
} {
	const [slideOrder, setSlideOrder] = useState<readonly string[]>(initial);
	const handlers = useSlideOrder({ slideOrder, setSlideOrder });
	return { slideOrder, setSlideOrder, ...handlers };
}

describe("useSlideOrder", () => {
	it("duplicateSlideOrder appends slideId to order", async () => {
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b"]));
		result.current.duplicateSlideOrder("a");

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["a", "b", "a"]);
		});
	});

	it("removeSlideOrder by index removes item at index", async () => {
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b", "c"]));
		result.current.removeSlideOrder({ slideId: "b", index: 1 });

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["a", "c"]);
		});
	});

	it("removeSlideOrder by slideId removes first occurrence", async () => {
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b", "a"]));
		result.current.removeSlideOrder({ slideId: "a" });

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["b", "a"]);
		});
	});

	it("removeSlideOrder does nothing when only one slide remains", async () => {
		const { result } = renderHook(() => useControlledSlideOrder(["only"]));
		result.current.removeSlideOrder({ slideId: "only", index: 0 });

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["only"]);
		});
	});

	it("moveSlideUp swaps item with previous", async () => {
		const INDEX_ONE = 1;
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b", "c"]));
		result.current.moveSlideUp(INDEX_ONE);

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["b", "a", "c"]);
		});
	});

	it("moveSlideUp does nothing at index 0", async () => {
		const INDEX_ZERO = 0;
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b"]));
		result.current.moveSlideUp(INDEX_ZERO);

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["a", "b"]);
		});
	});

	it("moveSlideDown swaps item with next", async () => {
		const INDEX_ONE = 1;
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b", "c"]));
		result.current.moveSlideDown(INDEX_ONE);

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["a", "c", "b"]);
		});
	});

	it("moveSlideDown does nothing at last index", async () => {
		const INDEX_ONE = 1;
		const { result } = renderHook(() => useControlledSlideOrder(["a", "b"]));
		result.current.moveSlideDown(INDEX_ONE);

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["a", "b"]);
		});
	});
});
