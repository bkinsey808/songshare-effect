import { cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import generateId from "./generate/generateId";
import useFormState from "./useFormState";

vi.mock("./generate/generateId");

describe("useFormState — renderHook", () => {
	it("returns initial slide order and slides with one slide", () => {
		vi.mocked(generateId).mockReturnValue("fixed-id-1");
		const { result } = renderHook(() => useFormState());
		expect(result.current.slideOrder).toStrictEqual(["fixed-id-1"]);
		expect(result.current.slides).toStrictEqual({
			"fixed-id-1": { slide_name: "Slide 1", field_data: {} },
		});
		expect(result.current.initialSlideId).toBe("fixed-id-1");
	});

	it("setSlideOrder updates slide order", async () => {
		vi.mocked(generateId).mockReturnValue("fixed-id-1");
		const { result } = renderHook(() => useFormState());
		result.current.setSlideOrder(["id-a", "id-b"]);

		await waitFor(() => {
			expect(result.current.slideOrder).toStrictEqual(["id-a", "id-b"]);
		});
	});

	it("setSlides updates slides", async () => {
		vi.mocked(generateId).mockReturnValue("fixed-id-1");
		const { result } = renderHook(() => useFormState());
		const newSlides = {
			"id-x": { slide_name: "Custom", field_data: { en: "Hello" } },
		};
		result.current.setSlides(newSlides);

		await waitFor(() => {
			expect(result.current.slides).toStrictEqual(newSlides);
		});
	});

	it("resetFormState returns new slide id and resets state", async () => {
		vi.mocked(generateId).mockReturnValueOnce("fixed-id-1").mockReturnValueOnce("fixed-id-2");

		const { result } = renderHook(() => useFormState());
		result.current.setSlideOrder(["fixed-id-1", "extra"]);
		result.current.setSlides({
			"fixed-id-1": { slide_name: "Old", field_data: {} },
			extra: { slide_name: "Extra", field_data: {} },
		});

		const newId = result.current.resetFormState();

		await waitFor(() => {
			expect(newId).toBe("fixed-id-2");
			expect(result.current.slideOrder).toStrictEqual(["fixed-id-2"]);
			expect(result.current.slides).toStrictEqual({
				"fixed-id-2": { slide_name: "Slide 1", field_data: {} },
			});
		});
	});
});

describe("useFormState — Harness", () => {
	it("harness renders form state", () => {
		cleanup();
		vi.mocked(generateId).mockReturnValue("fixed-id-1");

		/**
		 * Harness for useFormState used by tests to expose basic state values.
		 *
		 * @returns A small DOM fragment used by the harness test
		 */
		function Harness(): ReactElement {
			const { slideOrder, initialSlideId } = useFormState();
			return (
				<div data-testid="harness">
					<span data-testid="order">{slideOrder.join(",")}</span>
					<span data-testid="initial">{initialSlideId}</span>
				</div>
			);
		}

		render(<Harness />);
		expect(screen.getByTestId("order").textContent).toContain("fixed-id-1");
		expect(screen.getByTestId("initial").textContent).toBe("fixed-id-1");
	});
});
