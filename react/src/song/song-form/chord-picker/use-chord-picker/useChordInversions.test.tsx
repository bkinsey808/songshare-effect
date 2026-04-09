import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { assert, describe, expect, it, vi } from "vitest";

import type { SciInversion } from "@/react/music/inversions/computeSciInversions";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import useSciInversions from "./useChordInversions";

// ── Fixture constants ──────────────────────────────────────────────────────────

const SONG_KEY_GB = "Gb";
const EMPTY_SONG_KEY = "" as const;

// A minor chord rooted at A with song key Gb.
// Inversions: 1st = C (b3), 2nd = E (5)
const ROOT_A: SelectedRoot = { root: "A", rootType: "absolute", label: "A" };
const SHAPE_CODE_MINOR = "-";
const SHAPE_CODE_I6 = "I6"; // Italian Six — the SCI match for A minor 1st inversion

const BASS_C = "C" as const; // 1st inversion bass note (b3 of A minor)
const BASS_E = "E" as const; // 2nd inversion bass note (5 of A minor)
const BASS_A = "A" as const; // root position

const DISPLAY_MODE_LETTERS = ChordDisplayMode.letters;

// Two inversions for A minor: 1st (C) and 2nd (E)
const INV_COUNT_MINOR_A = 2;
const ZERO_LENGTH = 0;
const ONE_CALL = 1;

const ORDINAL_ROOT = "Root";
const ORDINAL_1ST = "1st";
const SHAPE_NAME_MINOR = "Minor Chord";
const INITIAL_TOKEN_A_MINOR_SLASH_E = "[A -/E]";

// ── Default hook params ────────────────────────────────────────────────────────

type HookParams = Readonly<Parameters<typeof useSciInversions>[number]>;

function makeParams(overrides: Partial<HookParams> = {}): HookParams {
	return {
		selectedRoot: ROOT_A,
		setSelectedRoot: vi.fn(),
		selectedShapeCode: SHAPE_CODE_MINOR,
		onShapeCodeChange: vi.fn(),
		songKey: SONG_KEY_GB,
		chordDisplayMode: DISPLAY_MODE_LETTERS,
		initialChordToken: undefined,
		...overrides,
	};
}

// ── Harness ────────────────────────────────────────────────────────────────────

type HarnessProps = Readonly<{
	params: HookParams;
}>;

/**
 * Harness for useSciInversions.
 *
 * Shows how the hook integrates into a chord inversion UI:
 * - `selectedBassNote` — current bass note, displayed when set
 * - `absoluteRoot` — resolved absolute root note
 * - `activeInversion` — currently selected inversion entry, or undefined
 * - `inversionBaseShapeName` — name of the original base chord shape
 * - `displaySciInversions` — list of computed inversions to render
 * - `displayInversionPreviewTokens` — preview token map keyed by bass root
 * - `slashPreviewTokens` — slash-notation tokens (never SCI names) keyed by bass root
 * - `handleSelectInversion` — selects/deselects a specific inversion
 * - `clearInversion` — resets to root position
 *
 * @param params - Full hook params forwarded from the test
 */
function Harness({ params }: HarnessProps): ReactElement {
	const {
		selectedBassNote,
		absoluteRoot,
		activeInversion,
		inversionBaseShapeName,
		displaySciInversions,
		displayInversionPreviewTokens,
		slashPreviewTokens,
		handleSelectInversion,
		clearInversion,
	} = useSciInversions(params);

	return (
		<div data-testid="harness">
			{/* selectedBassNote: bass note of the active inversion, or empty */}
			<div data-testid="selected-bass-note">{selectedBassNote ?? ""}</div>

			{/* absoluteRoot: resolved absolute root from selectedRoot + songKey */}
			<div data-testid="absolute-root">{absoluteRoot ?? ""}</div>

			{/* activeInversion: ordinal label of the currently active inversion */}
			<div data-testid="active-inversion-ordinal">{activeInversion?.ordinalLabel ?? "none"}</div>

			{/* activeInversion matched shape name (if SCI match exists) */}
			<div data-testid="active-inversion-matched-shape">
				{activeInversion?.matchedShape?.name ?? "none"}
			</div>

			{/* inversionBaseShapeName: name of the pre-inversion chord shape */}
			<div data-testid="inversion-base-shape-name">{inversionBaseShapeName}</div>

			{/* displaySciInversions: count and each inversion's ordinal label */}
			<div data-testid="inversion-count">{String(displaySciInversions.length)}</div>
			<ul>
				{displaySciInversions.map((inv) => (
					<li
						key={`${inv.bassRoot}-${String(inv.inversionNumber)}`}
						data-testid={`inversion-${inv.bassRoot}`}
					>
						{inv.ordinalLabel}
					</li>
				))}
			</ul>

			{/* displayInversionPreviewTokens: first inversion's preview token */}
			<div data-testid="preview-token-c">{displayInversionPreviewTokens.get(BASS_C) ?? ""}</div>

			{/* slashPreviewTokens: first inversion's slash-form token */}
			<div data-testid="slash-token-c">{slashPreviewTokens.get(BASS_C) ?? ""}</div>

			{/* handleSelectInversion: buttons for each inversion */}
			{displaySciInversions.map((inv) => (
				<button
					key={`btn-${inv.bassRoot}`}
					type="button"
					data-testid={`select-inv-${inv.bassRoot}`}
					onClick={() => {
						handleSelectInversion(inv);
					}}
				>
					select {inv.bassRoot}
				</button>
			))}

			{/* clearInversion: resets to root position */}
			<button
				type="button"
				data-testid="clear-inversion"
				onClick={() => {
					clearInversion();
				}}
			>
				clear
			</button>
		</div>
	);
}

// ── Harness tests ──────────────────────────────────────────────────────────────

describe("useSciInversions — Harness", () => {
	it("renders without errors and shows root-position state initially", () => {
		// Arrange
		cleanup();
		const params = makeParams();

		// Act
		render(<Harness params={params} />);

		// Assert
		expect(screen.getByTestId("selected-bass-note").textContent).toBe("");
		expect(screen.getByTestId("absolute-root").textContent).toBe(BASS_A);
		expect(screen.getByTestId("active-inversion-ordinal").textContent).toBe("none");
		expect(screen.getByTestId("inversion-base-shape-name").textContent).toBe(SHAPE_NAME_MINOR);
		expect(screen.getByTestId("inversion-count").textContent).toBe(String(INV_COUNT_MINOR_A));
	});

	it("selects 1st inversion and calls onShapeCodeChange with the SCI shape code", () => {
		// Arrange
		cleanup();
		const onShapeCodeChange = vi.fn();
		const params = makeParams({ onShapeCodeChange });
		render(<Harness params={params} />);

		// Act
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_C}`));

		// Assert — 1st inversion of A minor (bass C) matches Italian Six (I6)
		expect(screen.getByTestId("selected-bass-note").textContent).toBe(BASS_C);
		expect(onShapeCodeChange).toHaveBeenCalledTimes(ONE_CALL);
		expect(onShapeCodeChange).toHaveBeenCalledWith(SHAPE_CODE_I6);
	});

	it("selects 2nd inversion and calls onShapeCodeChange with the base shape code", () => {
		// Arrange
		cleanup();
		const onShapeCodeChange = vi.fn();
		const params = makeParams({ onShapeCodeChange });
		render(<Harness params={params} />);

		// Act
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_E}`));

		// Assert — 2nd inversion (bass E) has no SCI match → uses base shape
		expect(screen.getByTestId("selected-bass-note").textContent).toBe(BASS_E);
		expect(onShapeCodeChange).toHaveBeenCalledTimes(ONE_CALL);
		expect(onShapeCodeChange).toHaveBeenCalledWith(SHAPE_CODE_MINOR);
	});

	it("replaces the active inversion slot with a root-position entry after selection", () => {
		// Arrange
		cleanup();
		const params = makeParams();
		render(<Harness params={params} />);

		// Act
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_C}`));

		// Assert — C slot gone; A slot now shows "Root"
		expect(screen.getByTestId(`inversion-${BASS_A}`).textContent).toBe(ORDINAL_ROOT);
	});

	it("clears selectedBassNote and active inversion when clear button is clicked", () => {
		// Arrange
		cleanup();
		const params = makeParams();
		render(<Harness params={params} />);
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_C}`));

		// Act
		fireEvent.click(screen.getByTestId("clear-inversion"));

		// Assert — clearInversion only resets state; it does not call onShapeCodeChange
		expect(screen.getByTestId("selected-bass-note").textContent).toBe("");
		expect(screen.getByTestId("active-inversion-ordinal").textContent).toBe("none");
	});

	it("deselects when the root-position entry is clicked and restores base shape", () => {
		// Arrange
		cleanup();
		const onShapeCodeChange = vi.fn();
		const params = makeParams({ onShapeCodeChange });
		render(<Harness params={params} />);
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_C}`));

		// Act — the synthetic root entry appeared at bass A after C was selected
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_A}`));

		// Assert
		expect(screen.getByTestId("selected-bass-note").textContent).toBe("");
		expect(onShapeCodeChange).toHaveBeenLastCalledWith(SHAPE_CODE_MINOR);
	});

	it("switching from 1st to 2nd inversion preserves the original base shape code", () => {
		// Arrange
		cleanup();
		const onShapeCodeChange = vi.fn();
		const params = makeParams({ onShapeCodeChange });
		render(<Harness params={params} />);
		// Select 1st inversion first — this saves base shape code "-"
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_C}`));
		onShapeCodeChange.mockClear();

		// Act — switch directly to 2nd inversion without going back to root
		fireEvent.click(screen.getByTestId(`select-inv-${BASS_E}`));

		// Assert — 2nd inversion has no SCI match → original base shape "-" is used, not I6
		expect(screen.getByTestId("selected-bass-note").textContent).toBe(BASS_E);
		expect(onShapeCodeChange).toHaveBeenCalledTimes(ONE_CALL);
		expect(onShapeCodeChange).toHaveBeenCalledWith(SHAPE_CODE_MINOR);
	});

	it("slash-token-c uses slash notation while preview-token-c may use SCI notation", () => {
		// Arrange
		cleanup();
		const params = makeParams();

		// Act
		render(<Harness params={params} />);

		// Assert — slash token always uses slash form; display token may use SCI
		expect(screen.getByTestId("slash-token-c").textContent).toContain("/");
		expect(screen.getByTestId("slash-token-c").textContent).not.toBe(
			screen.getByTestId("preview-token-c").textContent,
		);
	});
});

// ── renderHook tests ──────────────────────────────────────────────────────────────

describe("useSciInversions — renderHook", () => {
	it("returns no active inversion and all inversions displayed on initial render", () => {
		// Arrange / Act
		const { result } = renderHook(() => useSciInversions(makeParams()));

		// Assert
		expect(result.current.selectedBassNote).toBeUndefined();
		expect(result.current.activeInversion).toBeUndefined();
		expect(result.current.displaySciInversions).toHaveLength(INV_COUNT_MINOR_A);
		expect(result.current.absoluteRoot).toBe(BASS_A);
		expect(result.current.inversionBaseShapeName).toBe(SHAPE_NAME_MINOR);
	});

	it("activeInversion reflects the selected inversion after handleSelectInversion", () => {
		// Arrange
		const { result } = renderHook(() => useSciInversions(makeParams()));
		const cInversion = result.current.displaySciInversions.find(
			(inv: SciInversion) => inv.bassRoot === BASS_C,
		);
		expect(cInversion).toBeDefined();
		assert(cInversion !== undefined);

		// Act
		act(() => {
			result.current.handleSelectInversion(cInversion);
		});

		// Assert
		expect(result.current.activeInversion?.bassRoot).toBe(BASS_C);
		expect(result.current.activeInversion?.ordinalLabel).toBe(ORDINAL_1ST);
	});

	it("initialises selectedBassNote from initialChordToken when editing a slash chord", () => {
		// Arrange / Act — pre-selects bass E from "[A -/E]"
		const { result } = renderHook(() =>
			useSciInversions(makeParams({ initialChordToken: INITIAL_TOKEN_A_MINOR_SLASH_E })),
		);

		// Assert
		expect(result.current.selectedBassNote).toBe(BASS_E);
	});

	it("returns no inversions when a roman root is given without a song key", () => {
		// Arrange / Act — cannot resolve an absolute root
		const romanRoot: SelectedRoot = { root: "I", rootType: "roman", label: "I" };
		const { result } = renderHook(() =>
			useSciInversions(makeParams({ selectedRoot: romanRoot, songKey: EMPTY_SONG_KEY })),
		);

		// Assert
		expect(result.current.absoluteRoot).toBeUndefined();
		expect(result.current.displaySciInversions).toHaveLength(ZERO_LENGTH);
	});

	it("slashPreviewTokens uses slash notation while displayInversionPreviewTokens may use SCI", () => {
		// Arrange / Act — no interaction needed; maps are computed on initial render
		const { result } = renderHook(() => useSciInversions(makeParams()));

		// The 1st inversion (C bass) matches Italian Six via SCI.
		// displayInversionPreviewTokens may show "[C I6]" but slashPreviewTokens must use "[A -/C]".
		const slashToken = result.current.slashPreviewTokens.get(BASS_C);
		const previewToken = result.current.displayInversionPreviewTokens.get(BASS_C);

		// Assert
		expect(slashToken).toBeDefined();
		expect(slashToken).toContain("/");
		expect(slashToken).not.toBe(previewToken);
	});

	it("replaces active inversion slot with a root-position entry in displaySciInversions", () => {
		// Arrange
		const { result } = renderHook(() => useSciInversions(makeParams()));
		const cInversion = result.current.displaySciInversions.find(
			(inv: SciInversion) => inv.bassRoot === BASS_C,
		);
		expect(cInversion).toBeDefined();
		assert(cInversion !== undefined);

		// Act
		act(() => {
			result.current.handleSelectInversion(cInversion);
		});

		// Assert — C slot gone; A slot with "Root" label appeared
		const rootSlot = result.current.displaySciInversions.find(
			(inv: SciInversion) => inv.ordinalLabel === ORDINAL_ROOT,
		);
		expect(rootSlot?.bassRoot).toBe(BASS_A);
		// The C bass-root entry must no longer appear in the inversions list
		const cSlot = result.current.displaySciInversions.find(
			(inv: SciInversion) => inv.bassRoot === BASS_C,
		);
		expect(cSlot).toBeUndefined();
	});
});
