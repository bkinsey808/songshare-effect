import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import useSongFormInitialValues from "./useSongFormInitialValues";

const INITIAL_SLIDE_ID = "slide-1";

describe("useSongFormInitialValues — renderHook", () => {
	it("returns expected initial values for new song", () => {
		// Arrange + Act
		const { result } = renderHook(() =>
			useSongFormInitialValues({
				songId: undefined,
				initialSlideId: INITIAL_SLIDE_ID,
			}),
		);

		// Assert — no Act: verifying initial render state only
		expect(result.current).toStrictEqual({
			song_id: undefined,
			song_name: "",
			song_slug: "",
			lyrics: [defaultLanguage],
			script: [],
			translations: [],
			short_credit: "",
			long_credit: "",
			private_notes: "",
			public_notes: "",
			slide_order: [INITIAL_SLIDE_ID],
			tags: [],
			slides: {
				[INITIAL_SLIDE_ID]: {
					slide_name: "Slide 1",
					field_data: {},
				},
			},
		});
	});

	it("returns expected initial values for existing song", () => {
		// Arrange + Act
		const { result } = renderHook(() =>
			useSongFormInitialValues({
				songId: "song-123",
				initialSlideId: INITIAL_SLIDE_ID,
			}),
		);

		// Assert — no Act: verifying initial render state only
		expect(result.current.song_id).toBe("song-123");
	});
});

describe("useSongFormInitialValues — Harness", () => {
	/**
	 * Harness for useSongFormInitialValues.
	 *
	 * @returns A small DOM fragment
	 */
	function Harness(): ReactElement {
		const initialValues = useSongFormInitialValues({
			songId: "song-123",
			initialSlideId: INITIAL_SLIDE_ID,
		});

		return <div data-testid="song-id">{initialValues.song_id}</div>;
	}

	it("renders initial values in harness", () => {
		// Arrange + Act
		const { getByTestId } = render(<Harness />);

		// Assert — no Act: verifying initial render state only
		expect(getByTestId("song-id").textContent).toBe("song-123");
	});
});
