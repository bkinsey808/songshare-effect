import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import makeSongFromIds from "@/react/test-utils/makeSongFromIds";
// Numeric constants used in assertions to make expected values explicit.
import { ONE, THREE, TWO, ZERO } from "@/shared/constants/shared-constants";

import { songFields } from "../song-schema";
import { useSongViewSlides } from "./useSongViewSlides";

/**
 * Convert an array of slide ids into a SongPublic fixture using the shared
 * `makeSongPublic` factory. This keeps tests concise while avoiding inline
 * eslint disables — the nullables and schema shapes are handled centrally.
 */

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
		const song = makeSongFromIds([]);
		const { result } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(() =>
			useSongViewSlides(song),
		);
		expect(result.current.currentSlide).toBeUndefined();
		expect(result.current.displayFields).toStrictEqual(["lyrics"]);
	});

	it("uses custom fields array", () => {
		const song = makeSongFromIds(["a"], ["script", "lyrics"]);
		const { result } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(() =>
			useSongViewSlides(song),
		);
		expect(result.current.displayFields).toStrictEqual(["script", "lyrics"]);
	});

	it("initial state and displayFields with slides", () => {
		const song = makeSongFromIds(["a", "b"]);
		const { result } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(() =>
			useSongViewSlides(song),
		);

		expect(result.current.totalSlides).toBe(TWO);
		expect(result.current.clampedIndex).toBe(ZERO);
		expect(result.current.currentSlide).toStrictEqual(song.slides["a"]);
		expect(result.current.displayFields).toStrictEqual(["lyrics"]);
	});

	it("navigation functions behave correctly", async () => {
		const song = makeSongFromIds(["a", "b"]);
		const { result } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(() =>
			useSongViewSlides(song),
		);

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
		const song = makeSongFromIds(["a", "b", "c"]);
		const { result } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(() =>
			useSongViewSlides(song),
		);

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
		const song = makeSongFromIds(["a", "b"]);
		const { result } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(() =>
			useSongViewSlides(song),
		);

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
		const song = makeSongFromIds(["a", "b"]);
		const { result: r2, unmount: u2 } = renderHook<ReturnType<typeof useSongViewSlides>, unknown>(
			() => useSongViewSlides(song),
		);
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
		const large = makeSongFromIds(["a", "b", "c"]);
		const small = makeSongFromIds(["a"]);

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
