import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SongFormValues } from "../song-form-types";
import useInitialFormState from "./useInitialFormState";

const DEFAULT_FORM_VALUES: SongFormValues = {
	song_name: "Test",
	song_slug: "test",
	key: "",
	short_credit: "",
	long_credit: "",
	public_notes: "",
	private_notes: "",
};

const DEFAULT_FORM_STATE = {
	formValues: DEFAULT_FORM_VALUES,
	fields: ["lyrics"] as readonly string[],
	slideOrder: ["slide-1"] as readonly string[],
	tags: [] as readonly string[],
	slides: {
		"slide-1": { slide_name: "Slide 1", field_data: {} },
	} as Record<string, { slide_name: string; field_data: Record<string, string> }>,
};

describe("useInitialFormState", () => {
	it("calls setInitialState when songId is undefined and not loading", async () => {
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		/**
		 * Test harness that calls `useInitialFormState` and renders a simple div.
		 *
		 * @returns A small DOM fragment used by the test
		 */
		function Harness(): ReactElement {
			useInitialFormState({
				songId: undefined,
				formValues: DEFAULT_FORM_STATE.formValues,
				fields: DEFAULT_FORM_STATE.fields,
				slideOrder: DEFAULT_FORM_STATE.slideOrder,
				tags: DEFAULT_FORM_STATE.tags,
				slides: DEFAULT_FORM_STATE.slides,
				isLoadingData: false,
				hasPopulatedRef,
				setInitialState,
			});
			return <div data-testid="harness">harness</div>;
		}

		render(<Harness />);

		await waitFor(() => {
			expect(setInitialState).toHaveBeenCalledWith(
				expect.objectContaining({
					formValues: DEFAULT_FORM_STATE.formValues,
					fields: DEFAULT_FORM_STATE.fields,
					slideOrder: DEFAULT_FORM_STATE.slideOrder,
					tags: DEFAULT_FORM_STATE.tags,
				}),
			);
		});
	});

	it("does not call setInitialState when isLoadingData is true", async () => {
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		/**
		 * Test harness that calls `useInitialFormState` and renders a simple div.
		 *
		 * @returns A small DOM fragment used by the test
		 */
		function Harness(): ReactElement {
			useInitialFormState({
				songId: undefined,
				formValues: DEFAULT_FORM_STATE.formValues,
				fields: DEFAULT_FORM_STATE.fields,
				slideOrder: DEFAULT_FORM_STATE.slideOrder,
				tags: DEFAULT_FORM_STATE.tags,
				slides: DEFAULT_FORM_STATE.slides,
				isLoadingData: true,
				hasPopulatedRef,
				setInitialState,
			});
			return <div data-testid="harness">harness</div>;
		}

		render(<Harness />);

		await waitFor(() => {
			expect(setInitialState).not.toHaveBeenCalled();
		});
	});

	it("calls setInitialState once per songId when editing", async () => {
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: true };

		/**
		 * Test harness that calls `useInitialFormState` and renders a simple div.
		 *
		 * @returns A small DOM fragment used by the test
		 */
		function Harness(): ReactElement {
			useInitialFormState({
				songId: "song-123",
				formValues: DEFAULT_FORM_STATE.formValues,
				fields: DEFAULT_FORM_STATE.fields,
				slideOrder: DEFAULT_FORM_STATE.slideOrder,
				tags: DEFAULT_FORM_STATE.tags,
				slides: DEFAULT_FORM_STATE.slides,
				isLoadingData: false,
				hasPopulatedRef,
				setInitialState,
			});
			return <div data-testid="harness">harness</div>;
		}

		render(<Harness />);

		await waitFor(() => {
			const EXPECTED_CALL_COUNT = 1;
			expect(setInitialState).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
			expect(setInitialState).toHaveBeenCalledWith(
				expect.objectContaining({
					formValues: DEFAULT_FORM_STATE.formValues,
					slideOrder: DEFAULT_FORM_STATE.slideOrder,
					tags: DEFAULT_FORM_STATE.tags,
				}),
			);
		});
	});

	it("harness renders without error", () => {
		cleanup();
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		/**
		 * Test harness that calls `useInitialFormState` and renders a simple div.
		 *
		 * @returns A small DOM fragment used by the test
		 */
		function Harness(): ReactElement {
			useInitialFormState({
				songId: undefined,
				formValues: DEFAULT_FORM_STATE.formValues,
				fields: DEFAULT_FORM_STATE.fields,
				slideOrder: DEFAULT_FORM_STATE.slideOrder,
				tags: DEFAULT_FORM_STATE.tags,
				slides: DEFAULT_FORM_STATE.slides,
				isLoadingData: false,
				hasPopulatedRef,
				setInitialState,
			});
			return <div data-testid="harness">initial</div>;
		}

		render(<Harness />);
		expect(screen.getByTestId("harness").textContent).toBe("initial");
	});
});
