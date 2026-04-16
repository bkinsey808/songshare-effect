import { describe, expect, it } from "vitest";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import forceCast from "@/react/lib/test-utils/forceCast";

import createTagLibrarySlice from "./createTagLibrarySlice";
import type { TagLibraryEntry } from "./TagLibraryEntry.type";
import type { TagLibrarySlice } from "./TagLibrarySlice.type";

/** Expected number of entries when a single entry is present. */
const SINGLE_ENTRY_COUNT = 1;

/**
 * Creates a minimal mock store slice for testing `createTagLibrarySlice`.
 *
 * Returns an object with:
 * - `slice`: the slice API produced by `createTagLibrarySlice`.
 * - `getState`: returns the current raw store state used by the slice.
 * - `setRawState`: apply a partial raw state patch to the store.
 *
 * The fixture wires simple `set`/`get` helpers and seeds `state` with the
 * slice's initial exported values so tests can assert on the resulting
 * state after invoking slice methods.
 *
 * @returns An object with `slice`, `getState`, and `setRawState` for tests
 */
function makeSlice(): {
	slice: TagLibrarySlice;
	getState: () => Record<string, unknown>;
	setRawState: (patch: Record<string, unknown>) => void;
} {
	let state: Record<string, unknown> = {};

	/**
	 * Apply a patch or updater function to the mocked slice state.
	 *
	 * @param patchOrUpdater - Partial state or updater function
	 * @returns void
	 */
	function set(
		patchOrUpdater:
			| Record<string, unknown>
			| ((prev: Record<string, unknown>) => Record<string, unknown>),
	): void {
		if (typeof patchOrUpdater === "function") {
			state = { ...state, ...patchOrUpdater(state) };
		} else {
			state = { ...state, ...patchOrUpdater };
		}
	}
	/**
	 * Returns the current mocked raw state used by the slice in tests.
	 *
	 * @returns The current raw state
	 */
	function get(): unknown {
		return state;
	}

	const api = {} as unknown;
	const slice = createTagLibrarySlice(forceCast(set), forceCast(get), forceCast(api));

	// Seed state with initial slice values so get() returns them
	state = { ...slice };

	/**
	 * Convenience to apply a raw state patch to the underlying mock store.
	 *
	 * @param patch - Partial raw state to apply
	 * @returns void
	 */
	function setRawState(patch: Record<string, unknown>): void {
		set(patch);
	}

	return { slice, getState: (): Record<string, unknown> => state, setRawState };
}

describe("createTagLibrarySlice", () => {
	describe("initial state", () => {
		it("has empty tagLibraryEntries", () => {
			const { getState } = makeSlice();
			expect(getState()["tagLibraryEntries"]).toStrictEqual({});
		});

		it("has empty tagLibraryCounts", () => {
			const { getState } = makeSlice();
			expect(getState()["tagLibraryCounts"]).toStrictEqual({});
		});

		it("has isTagLibraryLoading false", () => {
			const { getState } = makeSlice();
			expect(getState()["isTagLibraryLoading"]).toBe(false);
		});

		it("has tagLibraryError undefined", () => {
			const { getState } = makeSlice();
			expect(getState()["tagLibraryError"]).toBeUndefined();
		});
	});

	describe("setTagLibraryEntries", () => {
		it("replaces tagLibraryEntries", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryEntries({ rock: { user_id: "u1", tag_slug: "rock" } });
			expect(getState()["tagLibraryEntries"]).toStrictEqual({
				rock: { user_id: "u1", tag_slug: "rock" },
			});
		});
	});

	describe("setTagLibraryCounts", () => {
		it("replaces tagLibraryCounts", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryCounts({
				rock: { song: 3, playlist: 1, event: 0, community: 0, image: 2 },
			});
			expect(getState()["tagLibraryCounts"]).toStrictEqual({
				rock: { song: 3, playlist: 1, event: 0, community: 0, image: 2 },
			});
		});

		it("replaces previous counts", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryCounts({
				rock: { song: 1, playlist: 0, event: 0, community: 0, image: 0 },
			});
			slice.setTagLibraryCounts({
				jazz: { song: 2, playlist: 0, event: 0, community: 0, image: 0 },
			});
			expect(getState()["tagLibraryCounts"]).toStrictEqual({
				jazz: { song: 2, playlist: 0, event: 0, community: 0, image: 0 },
			});
		});
	});

	describe("addTagLibraryEntry", () => {
		it("adds a new entry keyed by tag_slug", () => {
			const { slice, getState } = makeSlice();
			slice.addTagLibraryEntry({ user_id: "u1", tag_slug: "jazz" });
			expect(
				forceCast<Record<string, TagLibraryEntry>>(getState()["tagLibraryEntries"])["jazz"],
			).toStrictEqual({
				user_id: "u1",
				tag_slug: "jazz",
			});
		});

		it("preserves existing entries when adding", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryEntries({ rock: { user_id: "u1", tag_slug: "rock" } });
			slice.addTagLibraryEntry({ user_id: "u1", tag_slug: "jazz" });
			const entries = forceCast<Record<string, TagLibraryEntry>>(getState()["tagLibraryEntries"]);
			expect(entries["rock"]).toBeDefined();
			expect(entries["jazz"]).toBeDefined();
		});

		it("overwrites an existing entry with the same slug", () => {
			const { slice, getState } = makeSlice();
			slice.addTagLibraryEntry({ user_id: "u1", tag_slug: "rock" });
			slice.addTagLibraryEntry({ user_id: "u2", tag_slug: "rock" });
			expect(
				forceCast<Record<string, TagLibraryEntry>>(getState()["tagLibraryEntries"])["rock"],
			).toStrictEqual({
				user_id: "u2",
				tag_slug: "rock",
			});
		});
	});

	describe("removeTagLibraryEntry", () => {
		it("removes the entry with the given slug", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryEntries({
				rock: { user_id: "u1", tag_slug: "rock" },
				jazz: { user_id: "u1", tag_slug: "jazz" },
			});
			slice.removeTagLibraryEntry("rock");
			const entries = forceCast<Record<string, TagLibraryEntry>>(getState()["tagLibraryEntries"]);
			expect(entries["rock"]).toBeUndefined();
			expect(entries["jazz"]).toBeDefined();
		});

		it("is a no-op when slug does not exist", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryEntries({ jazz: { user_id: "u1", tag_slug: "jazz" } });
			slice.removeTagLibraryEntry("nonexistent");
			expect(
				Object.keys(forceCast<Record<string, TagLibraryEntry>>(getState()["tagLibraryEntries"])),
			).toHaveLength(SINGLE_ENTRY_COUNT);
		});
	});

	describe("setTagLibraryLoading", () => {
		it("sets isTagLibraryLoading to true", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryLoading(true);
			expect(getState()["isTagLibraryLoading"]).toBe(true);
		});

		it("sets isTagLibraryLoading to false", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryLoading(true);
			slice.setTagLibraryLoading(false);
			expect(getState()["isTagLibraryLoading"]).toBe(false);
		});
	});

	describe("setTagLibraryError", () => {
		it("sets tagLibraryError to a string", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryError("something went wrong");
			expect(getState()["tagLibraryError"]).toBe("something went wrong");
		});

		it("clears tagLibraryError with undefined", () => {
			const { slice, getState } = makeSlice();
			slice.setTagLibraryError("oops");
			slice.setTagLibraryError(undefined);
			expect(getState()["tagLibraryError"]).toBeUndefined();
		});
	});

	describe("isInTagLibrary", () => {
		it("returns true when slug is in tagLibraryEntries", () => {
			const { slice } = makeSlice();
			slice.setTagLibraryEntries({ rock: { user_id: "u1", tag_slug: "rock" } });
			expect(slice.isInTagLibrary("rock")).toBe(true);
		});

		it("returns false when slug is absent", () => {
			const { slice } = makeSlice();
			expect(slice.isInTagLibrary("missing")).toBe(false);
		});
	});

	describe("getTagLibrarySlugs", () => {
		it("returns empty array when no entries", () => {
			const { slice } = makeSlice();
			expect(slice.getTagLibrarySlugs()).toStrictEqual([]);
		});

		it("returns all slugs", () => {
			const { slice } = makeSlice();
			slice.setTagLibraryEntries({
				rock: { user_id: "u1", tag_slug: "rock" },
				jazz: { user_id: "u1", tag_slug: "jazz" },
			});
			expect(slice.getTagLibrarySlugs().toSorted()).toStrictEqual(["jazz", "rock"]);
		});
	});

	describe("fetchTagLibrary / fetchTagLibraryCounts / removeTagFromLibrary / subscribeToTagLibrary", () => {
		it("fetchTagLibrary returns an Effect", () => {
			const { slice } = makeSlice();
			const effect = slice.fetchTagLibrary();
			expect(effect).toBeDefined();
			expect(typeof effect).toBe("object");
		});

		it("fetchTagLibraryCounts returns an Effect", () => {
			const { slice } = makeSlice();
			const effect = slice.fetchTagLibraryCounts();
			expect(effect).toBeDefined();
			expect(typeof effect).toBe("object");
		});

		it("removeTagFromLibrary returns an Effect", () => {
			const { slice } = makeSlice();
			const effect = slice.removeTagFromLibrary("rock");
			expect(effect).toBeDefined();
			expect(typeof effect).toBe("object");
		});

		it("subscribeToTagLibrary returns an Effect", () => {
			const { slice } = makeSlice();
			const effect = slice.subscribeToTagLibrary();
			expect(effect).toBeDefined();
			expect(typeof effect).toBe("object");
		});
	});

	describe("slice reset (sliceResetFns)", () => {
		it("reset calls tagLibraryUnsubscribe if set, then resets state", () => {
			sliceResetFns.clear();

			let unsubscribeCalled = false;
			const { slice, setRawState } = makeSlice();

			setRawState({
				tagLibraryUnsubscribe: (): void => {
					unsubscribeCalled = true;
				},
			});

			slice.setTagLibraryEntries({ rock: { user_id: "u1", tag_slug: "rock" } });
			slice.setTagLibraryLoading(true);

			for (const fn of sliceResetFns) {
				fn();
			}

			expect(unsubscribeCalled).toBe(true);

			sliceResetFns.clear();
		});

		it("reset restores initial state", () => {
			sliceResetFns.clear();

			const { slice, getState } = makeSlice();

			slice.setTagLibraryEntries({ rock: { user_id: "u1", tag_slug: "rock" } });
			slice.setTagLibraryLoading(true);

			for (const fn of sliceResetFns) {
				fn();
			}

			expect(getState()["tagLibraryEntries"]).toStrictEqual({});
			expect(getState()["isTagLibraryLoading"]).toBe(false);

			sliceResetFns.clear();
		});
	});
});
