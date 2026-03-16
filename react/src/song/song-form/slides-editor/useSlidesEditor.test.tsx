import type { DragEndEvent } from "@dnd-kit/core";
import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import { type Slide } from "../song-form-types";
import useSlidesEditor from "./useSlidesEditor";

const SLIDE_ORDER = ["s1", "s2", "s3"];
const SLIDES: Record<string, Slide> = {
	s1: { slide_name: "Slide 1", field_data: { lyrics: "", script: "", enTranslation: "" } },
	s2: { slide_name: "Slide 2", field_data: { lyrics: "", script: "", enTranslation: "" } },
	s3: { slide_name: "Slide 3", field_data: { lyrics: "", script: "", enTranslation: "" } },
};

describe("useSlidesEditor — Harness", () => {
	it("harness renders and exposes editor API", () => {
		cleanup();
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		function Harness(): ReactElement {
			const api = useSlidesEditor({
				slideOrder: SLIDE_ORDER,
				setSlideOrder,
				slides: SLIDES,
				setSlides,
			});
			return (
				<div data-testid="harness-root">
					<span data-testid="items">{api.sortableItems.join(",")}</span>
					<button
						type="button"
						data-testid="drag"
						onClick={() => {
							api.handleDragEnd(
								forceCast<DragEndEvent>({
									active: { id: "s1-0" },
									over: { id: "s3-2" },
								}),
							);
						}}
					>
						Drag
					</button>
				</div>
			);
		}

		const { getByTestId } = render(<Harness />);
		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("items").textContent).toBe("s1-0,s2-1,s3-2");
	});
});

describe("useSlidesEditor — renderHook", () => {
	it("sortableItems maps slide ids with index suffix", () => {
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		const { result } = renderHook(() =>
			useSlidesEditor({
				slideOrder: SLIDE_ORDER,
				setSlideOrder,
				slides: SLIDES,
				setSlides,
			}),
		);

		expect(result.current.sortableItems).toStrictEqual(["s1-0", "s2-1", "s3-2"]);
	});

	it("handleDragEnd reorders when active and over differ", () => {
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		const { result } = renderHook(() =>
			useSlidesEditor({
				slideOrder: SLIDE_ORDER,
				setSlideOrder,
				slides: SLIDES,
				setSlides,
			}),
		);

		result.current.handleDragEnd(
			forceCast<DragEndEvent>({
				active: { id: "s1-0" },
				over: { id: "s3-2" },
			}),
		);

		expect(setSlideOrder).toHaveBeenCalledWith(["s2", "s3", "s1"]);
	});

	it("editFieldValue updates slide field via setSlides", () => {
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		const { result } = renderHook(() =>
			useSlidesEditor({
				slideOrder: SLIDE_ORDER,
				setSlideOrder,
				slides: SLIDES,
				setSlides,
			}),
		);

		result.current.editFieldValue({
			slideId: "s1",
			field: "lyrics",
			value: "new lyric",
		});

		const expectedSlides = {
			s1: {
				slide_name: "Slide 1",
				field_data: { lyrics: "new lyric", script: "", enTranslation: "" },
			},
		};
		expect(setSlides).toHaveBeenCalledWith(expect.objectContaining(expectedSlides));
	});

	it("safeGetField returns value for existing slide and field", () => {
		const setSlideOrder = vi.fn();
		const setSlides = vi.fn();

		const { result } = renderHook(() =>
			useSlidesEditor({
				slideOrder: SLIDE_ORDER,
				setSlideOrder,
				slides: SLIDES,
				setSlides,
			}),
		);

		const val = result.current.safeGetField({
			slides: SLIDES,
			slideId: "s1",
			field: "lyrics",
		});
		expect(val).toBe("");
	});
});
