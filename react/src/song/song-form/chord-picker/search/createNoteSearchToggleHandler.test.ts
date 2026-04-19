import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { OCTAVE_SEMITONE_COUNT } from "@/react/music/intervals/interval-constants";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import rootSemitoneMap from "@/shared/music/chord-display/rootSemitoneMap";
import type { SongKey } from "@/shared/song/songKeyOptions";

import createNoteSearchToggleHandler from "./createNoteSearchToggleHandler";

// ── Types ──────────────────────────────────────────────────────────────────

type StateUpdater = (
	prev: ReadonlyMap<number, NoteSearchToggleState>,
) => ReadonlyMap<number, NoteSearchToggleState>;

// ── Index constants ────────────────────────────────────────────────────────

const FIRST_CALL_INDEX = 0;
const FIRST_ARG_INDEX = 0;

// ── Fixture constants ──────────────────────────────────────────────────────

const ROOT_C = "C" as SongKey; // semitone 0
const ROOT_D = "D" as SongKey; // semitone 2 — used as a bystander key in preservation tests
const ROOT_G = "G" as SongKey; // semitone 7

// Positional offsets passed to the handler (semitones above the chord root)
const OFFSET_ROOT = 0;
const OFFSET_MAJOR_THIRD = 4;
const OFFSET_FULL_OCTAVE = 12; // should wrap back to the root semitone via % 12

// Expected absolute semitones derived from the root + offset combinations above.
// Using rootSemitoneMap rather than bare literals keeps these in sync with the map.
const SEMITONE_C = rootSemitoneMap[ROOT_C]; // 0: C root + offset 0
const SEMITONE_D = rootSemitoneMap[ROOT_D]; // 2: used as a pre-existing bystander entry
const SEMITONE_E = (rootSemitoneMap[ROOT_C] + OFFSET_MAJOR_THIRD) % OCTAVE_SEMITONE_COUNT; // 4: fallback root (0) + major third
const SEMITONE_B = (rootSemitoneMap[ROOT_G] + OFFSET_MAJOR_THIRD) % OCTAVE_SEMITONE_COUNT; // 11: G (7) + major third (4)

const EMPTY_STATE = new Map<number, NoteSearchToggleState>();

// ── Helper ─────────────────────────────────────────────────────────────────

/**
 * Creates a typed mock for setNoteSearchState together with a helper that applies
 * the captured state updater to a given previous state. The applyUpdater helper
 * is safe to call after asserting toHaveBeenCalledOnce(), which guarantees the
 * mock received exactly one call before the updater is extracted.
 * @returns An object with a mock `setNoteSearchState` and an `applyUpdater` helper
 */
function makeSetNoteSearchState(): {
	setNoteSearchState: ReturnType<typeof vi.fn<(updater: StateUpdater) => void>>;
	applyUpdater: (
		prev: ReadonlyMap<number, NoteSearchToggleState>,
	) => ReadonlyMap<number, NoteSearchToggleState>;
} {
	const setNoteSearchState = vi.fn<(updater: StateUpdater) => void>();

	/**
	 * Apply the captured updater function to a previous state map.
	 *
	 * @param prev - Previous map of semitone -> toggle state
	 * @returns The next map after the updater is applied
	 */
	function applyUpdater(
		prev: ReadonlyMap<number, NoteSearchToggleState>,
	): ReadonlyMap<number, NoteSearchToggleState> {
		// forceCast is safe here — the caller must assert toHaveBeenCalledOnce() first.
		return forceCast<StateUpdater>(
			setNoteSearchState.mock.calls[FIRST_CALL_INDEX]?.[FIRST_ARG_INDEX],
		)(prev);
	}
	return { setNoteSearchState, applyUpdater };
}

// ── Tests ──────────────────────────────────────────────────────────────────

type CycleCase = {
	name: string;
	prev: ReadonlyMap<number, NoteSearchToggleState>;
	expected: ReadonlyMap<number, NoteSearchToggleState>;
};

const STATE_CYCLE_CASES: readonly CycleCase[] = [
	{
		name: "default → required: adds the semitone to the map as required",
		prev: EMPTY_STATE,
		expected: new Map([[SEMITONE_C, "required"]]),
	},
	{
		name: "required → excluded: advances the semitone to excluded",
		prev: new Map([[SEMITONE_C, "required"]]),
		expected: new Map([[SEMITONE_C, "excluded"]]),
	},
	{
		name: "excluded → default: removes the semitone from the map",
		prev: new Map([[SEMITONE_C, "excluded"]]),
		expected: EMPTY_STATE,
	},
];

describe("createNoteSearchToggleHandler", () => {
	it.each(STATE_CYCLE_CASES)("state cycling — $name", ({ prev, expected }) => {
		// Arrange
		const { setNoteSearchState, applyUpdater } = makeSetNoteSearchState();
		const handler = createNoteSearchToggleHandler({
			absoluteRoot: ROOT_C,
			setNoteSearchState,
		});

		// Act
		handler(OFFSET_ROOT);

		// Assert
		expect(setNoteSearchState).toHaveBeenCalledOnce();
		expect(applyUpdater(prev)).toStrictEqual(expected);
	});

	it("resolves the correct absolute semitone when absoluteRoot is defined — G + major-third offset toggles B (semitone 11)", () => {
		// Arrange
		const { setNoteSearchState, applyUpdater } = makeSetNoteSearchState();
		const handler = createNoteSearchToggleHandler({
			absoluteRoot: ROOT_G,
			setNoteSearchState,
		});

		// Act
		handler(OFFSET_MAJOR_THIRD);

		// Assert
		expect(setNoteSearchState).toHaveBeenCalledOnce();
		expect(applyUpdater(EMPTY_STATE).get(SEMITONE_B)).toBe("required");
	});

	it("falls back to semitone 0 when absoluteRoot is undefined — offset 4 toggles semitone 4 (E)", () => {
		// Arrange
		const { setNoteSearchState, applyUpdater } = makeSetNoteSearchState();
		const handler = createNoteSearchToggleHandler({
			absoluteRoot: undefined,
			setNoteSearchState,
		});

		// Act
		handler(OFFSET_MAJOR_THIRD);

		// Assert
		expect(setNoteSearchState).toHaveBeenCalledOnce();
		expect(applyUpdater(EMPTY_STATE).get(SEMITONE_E)).toBe("required");
	});

	it("wraps a full-octave offset back to the root semitone — C root + offset 12 toggles semitone 0 (C)", () => {
		// Arrange
		const { setNoteSearchState, applyUpdater } = makeSetNoteSearchState();
		const handler = createNoteSearchToggleHandler({
			absoluteRoot: ROOT_C,
			setNoteSearchState,
		});

		// Act
		handler(OFFSET_FULL_OCTAVE);

		// Assert
		expect(setNoteSearchState).toHaveBeenCalledOnce();
		expect(applyUpdater(EMPTY_STATE).get(SEMITONE_C)).toBe("required");
	});

	it("preserves unrelated entries in the map when a different semitone is toggled", () => {
		// Arrange
		const { setNoteSearchState, applyUpdater } = makeSetNoteSearchState();
		const handler = createNoteSearchToggleHandler({
			absoluteRoot: ROOT_C,
			setNoteSearchState,
		});
		// Pre-existing bystander entry at D (semitone 2) — should survive the toggle of C (semitone 0).
		const prevState = new Map<number, NoteSearchToggleState>([[SEMITONE_D, "required"]]);

		// Act
		handler(OFFSET_ROOT); // toggles semitone 0 (C), not D

		// Assert
		expect(setNoteSearchState).toHaveBeenCalledOnce();
		const result = applyUpdater(prevState);
		expect(result.get(SEMITONE_D)).toBe("required");
		expect(result.get(SEMITONE_C)).toBe("required");
	});
});
