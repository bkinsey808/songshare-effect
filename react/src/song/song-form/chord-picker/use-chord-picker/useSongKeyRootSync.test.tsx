import { act, cleanup, render, renderHook, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SongKey } from "@/shared/song/songKeyOptions";

import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import useSongKeyRootSync from "./useSongKeyRootSync";

const HARNESS_TEST_ID = "harness";
const SONG_KEY_G = "G";
const ROMAN_ROOT_I = "I";
const EMPTY_SONG_KEY = "" as const;
const ROOT_TYPE_ROMAN = "roman" as const;
const ROOT_TYPE_ABSOLUTE = "absolute" as const;
const EXPECTED_ABSOLUTE_ROOT = "G";
const ONE_CALL = 1;
const ZERO_CALLS = 0;

const romanRootI: SelectedRoot = {
	root: ROMAN_ROOT_I,
	rootType: ROOT_TYPE_ROMAN,
	label: ROMAN_ROOT_I,
};

const absoluteRootG: SelectedRoot = {
	root: SONG_KEY_G,
	rootType: ROOT_TYPE_ABSOLUTE,
	label: SONG_KEY_G,
};

type SyncProps = Readonly<{
	selectedRoot: SelectedRoot;
	songKey: SongKey | "";
	setSelectedRoot: (root: SelectedRoot) => void;
	setSelectedBassNote: (bassNote: SongKey | undefined) => void;
}>;

type HarnessProps = SyncProps;

/**
 * Harness for useSongKeyRootSync.
 *
 * Mounts the hook with the provided props to document its integration
 * surface. All setter callbacks are passed through to the hook.
 *
 * @param selectedRoot - Currently selected root
 * @param songKey - Current song key (may be empty string)
 * @param setSelectedRoot - Setter for the selected root state
 * @param setSelectedBassNote - Setter to clear the bass note state
 * @returns ReactElement
 */
function Harness({
	selectedRoot,
	songKey,
	setSelectedRoot,
	setSelectedBassNote,
}: HarnessProps): ReactElement {
	useSongKeyRootSync({ selectedRoot, songKey, setSelectedRoot, setSelectedBassNote });
	return <div data-testid={HARNESS_TEST_ID} />;
}

describe("useSongKeyRootSync — Harness", () => {
	it("mounts and renders without errors", () => {
		// Arrange
		cleanup();
		const setSelectedRoot = vi.fn();
		const setSelectedBassNote = vi.fn();

		// Act
		const rendered = render(
			<Harness
				selectedRoot={romanRootI}
				songKey={SONG_KEY_G}
				setSelectedRoot={setSelectedRoot}
				setSelectedBassNote={setSelectedBassNote}
			/>,
		);

		// Assert
		expect(within(rendered.container).getByTestId(HARNESS_TEST_ID)).toBeTruthy();
	});
});

describe("useSongKeyRootSync — renderHook", () => {
	it("converts a roman root to absolute when the song key changes from a valid key to empty", () => {
		// Arrange
		const setSelectedRoot = vi.fn();
		const setSelectedBassNote = vi.fn();

		// Act
		const { rerender } = renderHook(
			(props: SyncProps) => {
				useSongKeyRootSync(props);
			},
			{
				initialProps: {
					selectedRoot: romanRootI,
					songKey: SONG_KEY_G,
					setSelectedRoot,
					setSelectedBassNote,
				},
			},
		);
		act(() => {
			rerender({
				selectedRoot: romanRootI,
				songKey: EMPTY_SONG_KEY,
				setSelectedRoot,
				setSelectedBassNote,
			});
		});

		// Assert
		expect(setSelectedRoot).toHaveBeenCalledTimes(ONE_CALL);
		expect(setSelectedRoot).toHaveBeenCalledWith({
			root: EXPECTED_ABSOLUTE_ROOT,
			rootType: ROOT_TYPE_ABSOLUTE,
			label: EXPECTED_ABSOLUTE_ROOT,
		});
		expect(setSelectedBassNote).toHaveBeenCalledTimes(ONE_CALL);
		expect(setSelectedBassNote).toHaveBeenCalledWith(undefined);
	});

	it("does not call setters when the song key remains a valid key", () => {
		// Arrange
		const setSelectedRoot = vi.fn();
		const setSelectedBassNote = vi.fn();

		// Act
		const { rerender } = renderHook(
			(props: SyncProps) => {
				useSongKeyRootSync(props);
			},
			{
				initialProps: {
					selectedRoot: romanRootI,
					songKey: SONG_KEY_G,
					setSelectedRoot,
					setSelectedBassNote,
				},
			},
		);
		act(() => {
			rerender({
				selectedRoot: romanRootI,
				songKey: SONG_KEY_G,
				setSelectedRoot,
				setSelectedBassNote,
			});
		});

		// Assert
		expect(setSelectedRoot).toHaveBeenCalledTimes(ZERO_CALLS);
		expect(setSelectedBassNote).toHaveBeenCalledTimes(ZERO_CALLS);
	});

	it("does not call setters when the root type is absolute even if the song key is cleared", () => {
		// Arrange
		const setSelectedRoot = vi.fn();
		const setSelectedBassNote = vi.fn();

		// Act
		const { rerender } = renderHook(
			(props: SyncProps) => {
				useSongKeyRootSync(props);
			},
			{
				initialProps: {
					selectedRoot: absoluteRootG,
					songKey: SONG_KEY_G,
					setSelectedRoot,
					setSelectedBassNote,
				},
			},
		);
		act(() => {
			rerender({
				selectedRoot: absoluteRootG,
				songKey: EMPTY_SONG_KEY,
				setSelectedRoot,
				setSelectedBassNote,
			});
		});

		// Assert
		expect(setSelectedRoot).toHaveBeenCalledTimes(ZERO_CALLS);
		expect(setSelectedBassNote).toHaveBeenCalledTimes(ZERO_CALLS);
	});
});
