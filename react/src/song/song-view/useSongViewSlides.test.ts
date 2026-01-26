import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { songFields, type SongPublic } from "../song-schema";
import { useSongViewSlides } from "./useSongViewSlides";

/** Index into `fields` when creating slide data (keeps test data simple). */
const FIELD_INDEX = 0;

// Numeric constants used in assertions to make expected values explicit.
const ZERO = 0;
const ONE = 1;
const TWO = 2;
const THREE = 3;

/**
 * makeSongPublic
 *
 * Helper to construct a minimal `SongPublic` fixture for tests. It produces only
 * the fields required by `useSongViewSlides` so tests remain focused and easy
 * to reason about. The fixture is intentionally minimal and therefore cast to
 * `SongPublic` with `as unknown as SongPublic` rather than constructing a full
 * schema-complete object.
 *
 * @param slideIds - array of slide ids defining `slide_order`
 * @param fields - fields to include on each slide (defaults to ["lyrics"])
 * @returns a minimal `SongPublic` object suitable for unit tests
 */
function makeSongPublic(slideIds: string[], fields: readonly string[] = ["lyrics"]): SongPublic {
	const slides: Record<string, unknown> = {};
	for (let idx = 0; idx < slideIds.length; idx++) {
		const id = slideIds[idx] ?? String(idx);
		const key = fields[FIELD_INDEX] ?? "lyrics";
		slides[id] = {
			slide_name: `Slide ${idx}`,
			field_data: { [key]: `value-${id}` },
		};
	}
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
	return {
		song_id: "song-1",
		song_name: "Name",
		song_slug: "name",
		fields,
		slide_order: slideIds,
		slides,
		key: undefined,
		scale: undefined,
		user_id: "u",
		short_credit: undefined,
		long_credit: undefined,
		public_notes: undefined,
		created_at: "now",
		updated_at: "now",
	} as unknown as SongPublic;
}

/**
 * Unit tests for `useSongViewSlides`.
 *
 * Tests include default behavior, navigation helpers, keyboard handling,
 * cleanup on unmount, and clamping behavior when the slide list shrinks.
 */
describe("useSongViewSlides", () => {
	it("defaults when no songPublic", () => {
		const { result } = renderHook(() => useSongViewSlides(undefined));
		expect(result.current.totalSlides).toBe(ZERO);
		expect(result.current.clampedIndex).toBe(ZERO);
		expect(result.current.currentSlide).toBeUndefined();
		expect(result.current.displayFields).toStrictEqual(songFields);
	});

	it("handles empty slide_order with defined songPublic", () => {
		const song = makeSongPublic([]);
		const { result } = renderHook(() => useSongViewSlides(song));
		expect(result.current.totalSlides).toBe(ZERO);
		expect(result.current.clampedIndex).toBe(ZERO);
		expect(result.current.currentSlide).toBeUndefined();
		expect(result.current.displayFields).toStrictEqual(["lyrics"]);
	});

	it("uses custom fields array", () => {
		const song = makeSongPublic(["a"], ["script", "lyrics"]);
		const { result } = renderHook(() => useSongViewSlides(song));
		expect(result.current.displayFields).toStrictEqual(["script", "lyrics"]);
	});

	it("initial state and displayFields with slides", () => {
		const song = makeSongPublic(["a", "b"]);
		const { result } = renderHook(() => useSongViewSlides(song));

		expect(result.current.totalSlides).toBe(TWO);
		expect(result.current.clampedIndex).toBe(ZERO);
		expect(result.current.currentSlide).toStrictEqual(song.slides["a"]);
		expect(result.current.displayFields).toStrictEqual(["lyrics"]);
	});

	it("navigation functions behave correctly", async () => {
		const song = makeSongPublic(["a", "b"]);
		const { result } = renderHook(() => useSongViewSlides(song));

		// goNext
		result.current.goNext();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});

		// goPrev
		result.current.goPrev();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});

		// goLast
		result.current.goLast();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});

		// goFirst
		result.current.goFirst();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});
	});

	it("keyboard navigation works for slides", async () => {
		const song = makeSongPublic(["a", "b", "c"]);
		const { result } = renderHook(() => useSongViewSlides(song));

		expect(result.current.totalSlides).toBe(THREE);

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(TWO);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});
	});

	it("ignores non-navigation keyboard keys", async () => {
		const song = makeSongPublic(["a", "b"]);
		const { result } = renderHook(() => useSongViewSlides(song));

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		}); // No change

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		}); // No change
	});

	it("ignores keyboard when no slides and cleans up on unmount", async () => {
		const { result } = renderHook(() => useSongViewSlides(undefined));
		expect(result.current.totalSlides).toBe(ZERO);

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});

		// verify unmount removes listeners (no state changes occur after)
		const song = makeSongPublic(["a", "b"]);
		const { result: r2, unmount: u2 } = renderHook(() => useSongViewSlides(song));
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
		await waitFor(() => {
			expect(r2.current.clampedIndex).toBe(ONE);
		});
		u2();
		const prev = r2.current.clampedIndex;
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
		await waitFor(() => {
			expect(r2.current.clampedIndex).toBe(prev);
		});
	});

	it("clamps index when song slides shrink", async () => {
		const large = makeSongPublic(["a", "b", "c"]);
		const small = makeSongPublic(["a"]);

		const { result, rerender } = renderHook(({ songPublic }) => useSongViewSlides(songPublic), {
			initialProps: { songPublic: large },
		});

		// move to last index
		result.current.goLast();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(TWO);
		});

		// When the available slides shrink, the current index should be clamped
		// to the highest valid index for the new slide set.
		rerender({ songPublic: small });

		// wait for effect to sync the state
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});
		expect(result.current.currentSlide).toStrictEqual(small.slides["a"]);
	});
});
