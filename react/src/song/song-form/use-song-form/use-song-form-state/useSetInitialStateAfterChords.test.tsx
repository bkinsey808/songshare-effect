import { render, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { FormState } from "@/react/song/song-form/song-form-types";

import useSetInitialStateAfterChords from "./useSetInitialStateAfterChords";

const MOCK_STATE: FormState = {
	formValues: {
		song_name: "Test",
		song_slug: "test",
		lyrics: ["en"],
		script: [],
		translations: [],
		chords: ["C"],
		key: "",
		short_credit: "",
		long_credit: "",
		public_notes: "",
		private_notes: "",
	},
	slideOrder: ["s1"],
	tags: [],
	slides: { s1: { slide_name: "S1", field_data: {} } },
};

describe("useSetInitialStateAfterChords — renderHook", () => {
	it("calls setInitialState when not loading and populated", async () => {
		// Arrange
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: true };

		// Act
		renderHook(() => {
			useSetInitialStateAfterChords({
				isLoadingData: false,
				hasPopulatedRef,
				formValues: MOCK_STATE.formValues,
				slideOrder: MOCK_STATE.slideOrder,
				tags: MOCK_STATE.tags,
				slides: MOCK_STATE.slides,
				setInitialState,
			});
		});

		// Assert
		await waitFor(() => {
			expect(setInitialState).toHaveBeenCalledWith(MOCK_STATE);
		});
	});

	it("does not call setInitialState when loading", async () => {
		// Arrange
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: true };

		// Act
		renderHook(() => {
			useSetInitialStateAfterChords({
				isLoadingData: true,
				hasPopulatedRef,
				formValues: MOCK_STATE.formValues,
				slideOrder: MOCK_STATE.slideOrder,
				tags: MOCK_STATE.tags,
				slides: MOCK_STATE.slides,
				setInitialState,
			});
		});

		// Assert
		await waitFor(() => {
			expect(setInitialState).not.toHaveBeenCalled();
		});
	});

	it("does not call setInitialState when not populated", async () => {
		// Arrange
		const setInitialState = vi.fn();
		const hasPopulatedRef = { current: false };

		// Act
		renderHook(() => {
			useSetInitialStateAfterChords({
				isLoadingData: false,
				hasPopulatedRef,
				formValues: MOCK_STATE.formValues,
				slideOrder: MOCK_STATE.slideOrder,
				tags: MOCK_STATE.tags,
				slides: MOCK_STATE.slides,
				setInitialState,
			});
		});

		// Assert
		await waitFor(() => {
			expect(setInitialState).not.toHaveBeenCalled();
		});
	});
});

describe("useSetInitialStateAfterChords — Harness", () => {
	/**
	 * Harness for useSetInitialStateAfterChords.
	 *
	 * @param isLoadingData - Whether data is still loading
	 * @param hasPopulated - Whether the form has been populated
	 * @param setInitialState - Function to set the initial form state
	 * @returns A small DOM fragment
	 */
	function Harness({
		isLoadingData,
		hasPopulated,
		setInitialState,
	}: {
		readonly isLoadingData: boolean;
		readonly hasPopulated: boolean;
		readonly setInitialState: (state: FormState) => void;
	}): ReactElement {
		const hasPopulatedRef = React.useRef(hasPopulated);

		// Synchronize the hasPopulatedRef with the prop for the hook to use
		React.useEffect(() => {
			hasPopulatedRef.current = hasPopulated;
		}, [hasPopulated]);

		useSetInitialStateAfterChords({
			isLoadingData,
			hasPopulatedRef,
			formValues: MOCK_STATE.formValues,
			slideOrder: MOCK_STATE.slideOrder,
			tags: MOCK_STATE.tags,
			slides: MOCK_STATE.slides,
			setInitialState,
		});

		return <div data-testid="harness">Harness</div>;
	}

	it("triggers setInitialState from component lifecycle", async () => {
		// Arrange
		const setInitialState = vi.fn();

		// Act
		render(<Harness isLoadingData={false} hasPopulated setInitialState={setInitialState} />);

		// Assert
		await waitFor(() => {
			expect(setInitialState).toHaveBeenCalledWith(MOCK_STATE);
		});
	});
});
