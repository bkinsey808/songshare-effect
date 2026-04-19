import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { Slide } from "@/react/song/song-form/song-form-types";

import useSongFormState from "./useSongFormState";

/**
 * Harness for useSongFormState.
 *
 * @returns A small DOM fragment
 */
function Harness(): ReactElement {
	const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
	const hasPopulatedRef = useRef(false);
	const {
		formValues,
		setFormValue,
		setFormValuesState,
		handleSongNameBlur,
		resetFormValues,
		fields,
		hasUnsavedChanges,
		setInitialState,
		clearInitialState,
		resetForm,
		updateSlideOrder,
		updateSlides,
		slideOrder,
		slides,
	} = useSongFormState({
		formRef,
		songId: undefined,
		isLoadingData: false,
		isChangeTrackingReady: true,
		tags: [],
		hasPopulatedRef,
	});

	return (
		<div>
			<div data-testid="song-name">{formValues.song_name}</div>
			<div data-testid="fields-count">{fields.length}</div>
			<div data-testid="unsaved">{String(hasUnsavedChanges())}</div>

			<button
				type="button"
				data-testid="set-name"
				onClick={() => {
					setFormValue("song_name", "New Name");
				}}
			>
				Set Name
			</button>
			<button
				type="button"
				data-testid="set-values-state"
				onClick={() => {
					setFormValuesState((prev) => ({ ...prev, song_name: "Direct State Update" }));
				}}
			>
				Set Values State
			</button>
			<button type="button" data-testid="blur-name" onClick={handleSongNameBlur}>
				Blur Name
			</button>
			<button type="button" data-testid="reset-values" onClick={resetFormValues}>
				Reset Values
			</button>
			<button
				type="button"
				data-testid="set-initial"
				onClick={() => {
					setInitialState({
						formValues: { ...formValues, song_name: "Initial" },
						slideOrder,
						tags: [],
						slides,
					});
				}}
			>
				Set Initial
			</button>
			<button type="button" data-testid="clear-initial" onClick={clearInitialState}>
				Clear Initial
			</button>
			<button type="button" data-testid="reset-form" onClick={resetForm}>
				Reset Form
			</button>
			<button
				type="button"
				data-testid="update-order"
				onClick={() => {
					updateSlideOrder(["id-1"]);
				}}
			>
				Update Order
			</button>
			<button
				type="button"
				data-testid="update-slides"
				onClick={() => {
					updateSlides({ "id-1": { slide_name: "New", field_data: {} } });
				}}
			>
				Update Slides
			</button>
		</div>
	);
}

describe("useSongFormState — renderHook", () => {
	it("returns a hook with required properties", () => {
		// Arrange + Act
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			const hasPopulatedRef = useRef(false);
			return useSongFormState({
				formRef,
				songId: undefined,
				isLoadingData: false,
				isChangeTrackingReady: true,
				tags: [],
				hasPopulatedRef,
			});
		});

		// Assert — no Act: verifying initial render state only
		expect({
			formValuesDefined: result.current.formValues !== undefined,
			setFormValueDefined: result.current.setFormValue !== undefined,
			setFormValueIsFunction: typeof result.current.setFormValue === "function",
			updateSlideOrderDefined: result.current.updateSlideOrder !== undefined,
			updateSlideOrderIsFunction: typeof result.current.updateSlideOrder === "function",
			updateSlidesDefined: result.current.updateSlides !== undefined,
			updateSlidesIsFunction: typeof result.current.updateSlides === "function",
		}).toStrictEqual({
			formValuesDefined: true,
			setFormValueDefined: true,
			setFormValueIsFunction: true,
			updateSlideOrderDefined: true,
			updateSlideOrderIsFunction: true,
			updateSlidesDefined: true,
			updateSlidesIsFunction: true,
		});
	});

	it("provides updateSlideOrder function that updates internal state", () => {
		// Arrange
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			const hasPopulatedRef = useRef(false);
			return useSongFormState({
				formRef,
				songId: undefined,
				isLoadingData: false,
				isChangeTrackingReady: true,
				tags: [],
				hasPopulatedRef,
			});
		});

		// Act
		const newOrder = ["slide-1", "slide-2"];
		act(() => {
			result.current.updateSlideOrder(newOrder);
		});

		// Assert
		expect(result.current.slideOrder).toStrictEqual(newOrder);
	});

	it("provides updateSlides function that updates internal state", () => {
		// Arrange
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			const hasPopulatedRef = useRef(false);
			return useSongFormState({
				formRef,
				songId: undefined,
				isLoadingData: false,
				isChangeTrackingReady: true,
				tags: [],
				hasPopulatedRef,
			});
		});

		// Act
		const newSlides: Record<string, Slide> = {
			"slide-1": { slide_name: "Updated", field_data: {} },
		};
		act(() => {
			result.current.updateSlides(newSlides);
		});

		// Assert
		expect(result.current.slides).toStrictEqual(newSlides);
	});

	it("returns change tracking functions", () => {
		// Arrange + Act
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			const hasPopulatedRef = useRef(false);
			return useSongFormState({
				formRef,
				songId: undefined,
				isLoadingData: false,
				isChangeTrackingReady: true,
				tags: [],
				hasPopulatedRef,
			});
		});

		// Assert — no Act: verifying initial render state only
		expect(typeof result.current.hasUnsavedChanges).toBe("function");
		expect(typeof result.current.setInitialState).toBe("function");
		expect(typeof result.current.clearInitialState).toBe("function");
	});

	it("handles change tracking disabled when isLoadingData is true", () => {
		// Arrange
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			const hasPopulatedRef = useRef(false);
			return useSongFormState({
				formRef,
				songId: "song-123",
				isLoadingData: true,
				isChangeTrackingReady: false,
				tags: [],
				hasPopulatedRef,
			});
		});

		// Assert — no Act: verifying initial render state only
		expect(result.current.hasUnsavedChanges()).toBe(false);
	});
});

describe("useSongFormState — Harness", () => {
	it("harness renders state and handles complex actions", async () => {
		// Arrange
		cleanup();

		// Act
		render(<Harness />);

		// Assert — initial state
		expect(screen.getByTestId("song-name").textContent).toBe("");
		expect(screen.getByTestId("unsaved").textContent).toBe("false");

		// Act — set name
		screen.getByTestId("set-name").click();

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("song-name").textContent).toBe("New Name");
			expect(screen.getByTestId("unsaved").textContent).toBe("true");
		});

		// Act — set values state
		screen.getByTestId("set-values-state").click();

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("song-name").textContent).toBe("Direct State Update");
		});

		// Act — reset values
		screen.getByTestId("reset-values").click();

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("song-name").textContent).toBe("");
		});

		// Act — update order
		screen.getByTestId("update-order").click();
		// Assert (no UI binding for order yet, but ensures no crash)

		// Act — set initial
		screen.getByTestId("set-initial").click();
		// Assert unsaved changes now false because current matches initial
		await waitFor(() => {
			expect(screen.getByTestId("unsaved").textContent).toBe("false");
		});
	});
});
