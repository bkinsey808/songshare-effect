import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useSlideFields from "./useSlideFields";

const SLIDE_S1 = {
	slide_name: "Slide 1",
	field_data: { lyrics: "hello", chords: "Am" },
};

describe("useSlideFields — Harness", () => {
	it("harness renders and exposes handlers", () => {
		cleanup();
		const setSlides = vi.fn();
		const slides = { s1: SLIDE_S1 };

		function Harness(): ReactElement {
			const { editFieldValue, editSlideName, safeGetField } = useSlideFields({
				slides,
				setSlides,
			});
			return (
				<div data-testid="harness-root">
					<span data-testid="lyrics">
						{safeGetField({ slides, slideId: "s1", field: "lyrics" })}
					</span>
					<button
						type="button"
						data-testid="edit"
						onClick={() => {
							editFieldValue({ slideId: "s1", field: "lyrics", value: "updated" });
						}}
					>
						Edit
					</button>
					<button
						type="button"
						data-testid="rename"
						onClick={() => {
							editSlideName({ slideId: "s1", newName: "New Name" });
						}}
					>
						Rename
					</button>
				</div>
			);
		}

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("lyrics").textContent).toBe("hello");
	});
});

describe("useSlideFields — renderHook", () => {
	it("safeGetField returns value when slide and field exist", () => {
		const setSlides = vi.fn();
		const slides = { s1: SLIDE_S1 };

		const { result } = renderHook(() => useSlideFields({ slides, setSlides }));

		expect(result.current.safeGetField({ slides, slideId: "s1", field: "lyrics" })).toBe("hello");
		expect(result.current.safeGetField({ slides, slideId: "s1", field: "chords" })).toBe("Am");
	});

	it("safeGetField returns empty string when slide missing", () => {
		const setSlides = vi.fn();
		const slides: Record<string, typeof SLIDE_S1> = {};

		const { result } = renderHook(() => useSlideFields({ slides, setSlides }));

		expect(result.current.safeGetField({ slides, slideId: "missing", field: "lyrics" })).toBe("");
	});

	it("safeGetField returns empty string when field missing", () => {
		const setSlides = vi.fn();
		const slides = { s1: SLIDE_S1 };

		const { result } = renderHook(() => useSlideFields({ slides, setSlides }));

		expect(result.current.safeGetField({ slides, slideId: "s1", field: "unknown" })).toBe("");
	});

	it("editFieldValue updates slide field via setSlides", () => {
		const setSlides = vi.fn();
		const slides = { s1: SLIDE_S1 };

		const { result } = renderHook(() => useSlideFields({ slides, setSlides }));

		result.current.editFieldValue({ slideId: "s1", field: "lyrics", value: "new" });

		expect(setSlides).toHaveBeenCalledWith({
			s1: {
				...SLIDE_S1,
				field_data: { ...SLIDE_S1.field_data, lyrics: "new" },
			},
		});
	});

	it("editSlideName updates slide name via setSlides", () => {
		const setSlides = vi.fn();
		const slides = { s1: SLIDE_S1 };

		const { result } = renderHook(() => useSlideFields({ slides, setSlides }));

		result.current.editSlideName({ slideId: "s1", newName: "Renamed" });

		expect(setSlides).toHaveBeenCalledWith({
			s1: { ...SLIDE_S1, slide_name: "Renamed" },
		});
	});

	it("editSlideBackgroundImage updates background metadata via setSlides", () => {
		const setSlides = vi.fn();
		const slides = { s1: SLIDE_S1 };

		const { result } = renderHook(() => useSlideFields({ slides, setSlides }));

		result.current.editSlideBackgroundImage({
			slideId: "s1",
			backgroundImageId: "img-1",
			backgroundImageUrl: "/api/images/serve/images/u1/img-1.png",
		});

		expect(setSlides).toHaveBeenCalledWith({
			s1: {
				...SLIDE_S1,
				background_image_id: "img-1",
				background_image_url: "/api/images/serve/images/u1/img-1.png",
			},
		});
	});
});
