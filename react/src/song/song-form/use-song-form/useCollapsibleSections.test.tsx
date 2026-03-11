import { cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useCollapsibleSections from "./useCollapsibleSections";

describe("useCollapsibleSections — renderHook", () => {
	it("returns all sections expanded initially", () => {
		const { result } = renderHook(() => useCollapsibleSections());
		expect(result.current.isFormFieldsExpanded).toBe(true);
		expect(result.current.isSlidesExpanded).toBe(true);
		expect(result.current.isGridExpanded).toBe(true);
	});

	it("setIsFormFieldsExpanded updates form fields expansion", async () => {
		const { result } = renderHook(() => useCollapsibleSections());
		result.current.setIsFormFieldsExpanded(false);

		await waitFor(() => {
			expect(result.current.isFormFieldsExpanded).toBe(false);
		});
	});

	it("setIsSlidesExpanded updates slides expansion", async () => {
		const { result } = renderHook(() => useCollapsibleSections());
		result.current.setIsSlidesExpanded(false);

		await waitFor(() => {
			expect(result.current.isSlidesExpanded).toBe(false);
		});
	});

	it("setIsGridExpanded updates grid expansion", async () => {
		const { result } = renderHook(() => useCollapsibleSections());
		result.current.setIsGridExpanded(false);

		await waitFor(() => {
			expect(result.current.isGridExpanded).toBe(false);
		});
	});
});

describe("useCollapsibleSections — Harness", () => {
	it("harness renders expansion state", () => {
		cleanup();

		function Harness(): ReactElement {
			const { isFormFieldsExpanded, isSlidesExpanded, isGridExpanded } = useCollapsibleSections();
			return (
				<div data-testid="harness">
					<span data-testid="form">{String(isFormFieldsExpanded)}</span>
					<span data-testid="slides">{String(isSlidesExpanded)}</span>
					<span data-testid="grid">{String(isGridExpanded)}</span>
				</div>
			);
		}

		render(<Harness />);
		expect(screen.getByTestId("form").textContent).toBe("true");
		expect(screen.getByTestId("slides").textContent).toBe("true");
		expect(screen.getByTestId("grid").textContent).toBe("true");
	});
});
