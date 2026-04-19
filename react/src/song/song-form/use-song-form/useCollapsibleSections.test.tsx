import { cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useCollapsibleSections from "./useCollapsibleSections";

/**
 * Harness for useCollapsibleSections used in tests.
 *
 * @returns A small DOM fragment used by the harness test
 */
function Harness(): ReactElement {
	const {
		isFormFieldsExpanded,
		setIsFormFieldsExpanded,
		isSlidesExpanded,
		setIsSlidesExpanded,
		isGridExpanded,
		setIsGridExpanded,
	} = useCollapsibleSections();
	return (
		<div data-testid="harness">
			<span data-testid="form">{String(isFormFieldsExpanded)}</span>
			<span data-testid="slides">{String(isSlidesExpanded)}</span>
			<span data-testid="grid">{String(isGridExpanded)}</span>

			<button
				type="button"
				data-testid="toggle-form"
				onClick={() => {
					setIsFormFieldsExpanded(!isFormFieldsExpanded);
				}}
			>
				Toggle Form
			</button>
			<button
				type="button"
				data-testid="toggle-slides"
				onClick={() => {
					setIsSlidesExpanded(!isSlidesExpanded);
				}}
			>
				Toggle Slides
			</button>
			<button
				type="button"
				data-testid="toggle-grid"
				onClick={() => {
					setIsGridExpanded(!isGridExpanded);
				}}
			>
				Toggle Grid
			</button>
		</div>
	);
}

describe("useCollapsibleSections — renderHook", () => {
	it("returns all sections expanded initially", () => {
		// Arrange + Act
		const { result } = renderHook(() => useCollapsibleSections());

		// Assert — no Act: verifying initial render state only
		expect(result.current.isFormFieldsExpanded).toBe(true);
		expect(result.current.isSlidesExpanded).toBe(true);
		expect(result.current.isGridExpanded).toBe(true);
	});

	it("setIsFormFieldsExpanded updates form fields expansion", async () => {
		// Arrange
		const { result } = renderHook(() => useCollapsibleSections());

		// Act
		result.current.setIsFormFieldsExpanded(false);

		// Assert
		await waitFor(() => {
			expect(result.current.isFormFieldsExpanded).toBe(false);
		});
	});

	it("setIsSlidesExpanded updates slides expansion", async () => {
		// Arrange
		const { result } = renderHook(() => useCollapsibleSections());

		// Act
		result.current.setIsSlidesExpanded(false);

		// Assert
		await waitFor(() => {
			expect(result.current.isSlidesExpanded).toBe(false);
		});
	});

	it("setIsGridExpanded updates grid expansion", async () => {
		// Arrange
		const { result } = renderHook(() => useCollapsibleSections());

		// Act
		result.current.setIsGridExpanded(false);

		// Assert
		await waitFor(() => {
			expect(result.current.isGridExpanded).toBe(false);
		});
	});
});

describe("useCollapsibleSections — Harness", () => {
	it("harness renders expansion state and toggles sections", async () => {
		// Arrange
		cleanup();

		// Act
		render(<Harness />);

		// Assert — initial state
		expect(screen.getByTestId("form").textContent).toBe("true");
		expect(screen.getByTestId("slides").textContent).toBe("true");
		expect(screen.getByTestId("grid").textContent).toBe("true");

		// Act — toggle form
		screen.getByTestId("toggle-form").click();

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("form").textContent).toBe("false");
		});

		// Act — toggle slides
		screen.getByTestId("toggle-slides").click();

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("slides").textContent).toBe("false");
		});

		// Act — toggle grid
		screen.getByTestId("toggle-grid").click();

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("grid").textContent).toBe("false");
		});
	});
});
