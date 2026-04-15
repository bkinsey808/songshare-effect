import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import randomId from "./randomId";
import useSlideData from "./useSlideData";
import {
    expectSetSlidesAddSlideShape,
    expectSetSlidesDuplicateSlideShape,
} from "./useSlideData.test-util";

vi.mock("./randomId");

const INITIAL_SLIDES = {
	s1: { slide_name: "Slide 1", field_data: { lyrics: "" } },
};
const INITIAL_ORDER = ["s1"];

describe("useSlideData — Harness", () => {
	it("harness renders and exposes addSlide, deleteSlide, duplicateSlide", () => {
		cleanup();
		vi.mocked(randomId).mockReturnValue("new-id");
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		/**
		 * Test harness for slide data hook.
		 *
		 * @returns DOM fragment used by tests
		 */
		function Harness(): ReactElement {
			const { addSlide, deleteSlide, duplicateSlide } = useSlideData({
				slideOrder: INITIAL_ORDER,
				setSlideOrder,
				slides: INITIAL_SLIDES,
				setSlides,
			});
			return (
				<div data-testid="harness-root">
					<button type="button" data-testid="add" onClick={addSlide}>
						Add
					</button>
					<button
						type="button"
						data-testid="del"
						onClick={() => {
							deleteSlide("s1");
						}}
					>
						Delete
					</button>
					<button
						type="button"
						data-testid="dup"
						onClick={() => {
							duplicateSlide("s1");
						}}
					>
						Duplicate
					</button>
				</div>
			);
		}

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
	});
});

describe("useSlideData — renderHook", () => {
	it("addSlide appends new slide and updates order", () => {
		vi.mocked(randomId).mockReturnValue("new-id");
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		const { result } = renderHook(() =>
			useSlideData({
				slideOrder: INITIAL_ORDER,
				setSlideOrder,
				slides: INITIAL_SLIDES,
				setSlides,
			}),
		);

		result.current.addSlide();

		expect(setSlideOrder).toHaveBeenCalledWith(["s1", "new-id"]);
		expectSetSlidesAddSlideShape(setSlides);
	});

	it("deleteSlide removes slide when more than one exists", () => {
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();
		const slides = {
			s1: { slide_name: "Slide 1", field_data: {} },
			s2: { slide_name: "Slide 2", field_data: {} },
		};
		const order = ["s1", "s2"];

		const { result } = renderHook(() =>
			useSlideData({ slideOrder: order, setSlideOrder, slides, setSlides }),
		);

		result.current.deleteSlide("s1");

		expect(setSlideOrder).toHaveBeenCalledWith(["s2"]);
		expect(setSlides).toHaveBeenCalledWith({ s2: slides.s2 });
	});

	it("deleteSlide does nothing when only one slide remains", () => {
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		const { result } = renderHook(() =>
			useSlideData({
				slideOrder: INITIAL_ORDER,
				setSlideOrder,
				slides: INITIAL_SLIDES,
				setSlides,
			}),
		);

		result.current.deleteSlide("s1");

		expect(setSlideOrder).not.toHaveBeenCalled();
		expect(setSlides).not.toHaveBeenCalled();
	});

	it("duplicateSlide creates copy with duplicated field_data", () => {
		vi.mocked(randomId).mockReturnValue("dup-id");
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();
		const slides = {
			s1: { slide_name: "Slide 1", field_data: { lyrics: "content" } },
		};

		const { result } = renderHook(() =>
			useSlideData({
				slideOrder: INITIAL_ORDER,
				setSlideOrder,
				slides,
				setSlides,
			}),
		);

		result.current.duplicateSlide("s1");

		expectSetSlidesDuplicateSlideShape(setSlides);
		expect(setSlideOrder).toHaveBeenCalledWith(["s1", "dup-id"]);
	});
});
