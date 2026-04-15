import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Slide, SongFormChordPickerRequest } from "@/react/song/song-form/song-form-types";

import useSortableGridCells from "./useSortableGridCells";

const SLIDE_ID = "slide-1";
const LYRICS_FIELD = "lyrics";
const OTHER_FIELD = "title";
const LYRICS_VALUE = "Hello [C -]";
const CHORD_TOKEN = "[C -]";
const CARET_INSIDE_CHORD_INDEX = 8;
const INSERTED_CHORD = "[G]";
const LYRICS_WITH_INSERTED_CHORD = `${LYRICS_VALUE}${INSERTED_CHORD}`;
const LYRICS_WITH_REPLACED_CHORD = `Hello ${INSERTED_CHORD}`;

type HookParams = Parameters<typeof useSortableGridCells> extends [infer FirstParam, ...unknown[]]
	? FirstParam
	: never;

type HookActions = Readonly<{
	openChordPicker: HookParams["openChordPicker"];
	editFieldValue: HookParams["editFieldValue"];
	safeGetField: HookParams["safeGetField"];
}>;

const SLIDES: Readonly<Record<string, Slide>> = {
	[SLIDE_ID]: {
		slide_name: "Test Slide",
		field_data: { [LYRICS_FIELD]: LYRICS_VALUE },
	},
};

/**
 * Create action mocks used by the hook tests.
 *
 * @returns HookActions with jest/vitest spies
 */
function makeActions(): HookActions {
	return {
		openChordPicker: vi.fn(),
		editFieldValue: vi.fn(),
		safeGetField: vi.fn(() => LYRICS_VALUE),
	};
}

/**
 * Create default hook params and action mocks for the hook under test.
 *
 * @param overrides - Partial overrides to the default hook params
 * @returns An object containing `params` and `actions` for tests
 */
function makeParams(
	overrides: Partial<HookParams> = {},
): Readonly<{ params: HookParams; actions: HookActions }> {
	const actions = makeActions();
	const params: HookParams = {
		slideId: SLIDE_ID,
		fields: [LYRICS_FIELD],
		slides: SLIDES,
		...actions,
		...overrides,
	};
	return { params, actions };
}

/**
 * Retrieves the first request passed to the openChordPicker mock.
 *
 * @param openChordPicker - Mocked openChordPicker function
 * @returns First chord picker request
 */
function getFirstChordPickerRequest(
	openChordPicker: HookActions["openChordPicker"],
): SongFormChordPickerRequest {
	const [firstCallArgs] = vi.mocked(openChordPicker).mock.calls;
	if (firstCallArgs === undefined) {
		throw new TypeError("Expected openChordPicker to be called at least once");
	}
	const [firstRequest] = firstCallArgs;
	return firstRequest;
}

/**
 * Resolves the lyrics textarea and narrows it to HTMLTextAreaElement.
 *
 * @param container - Rendered test container
 * @returns The lyrics textarea element
 */
function getLyricsTextarea(container: HTMLElement): HTMLTextAreaElement {
	const el = within(container).getByTestId("lyrics-textarea");
	if (!(el instanceof HTMLTextAreaElement)) {
		throw new TypeError("Expected a HTMLTextAreaElement");
	}
	return el;
}

/**
 * Harness for useSortableGridCells.
 *
 * Shows how useSortableGridCells integrates into grid row cell rendering:
 * - A textarea receiving lyricsTextareaRef, wired to onSyncLyricsSelection so
 *   cursor movement updates isEditingChord
 * - hasLyrics and isEditingChord derived flags exposed through data-testid divs
 * - A button wired to onOpenChordPicker that opens the chord picker overlay
 *
 * @param params - Fully configured hook parameters
 * @returns React element rendering the harness
 */
function Harness({ params }: Readonly<{ params: HookParams }>): ReactElement {
	const {
		lyricsTextareaRef, // ref wired to the lyrics textarea for selection tracking
		isEditingChord, // true when the current selection overlaps a chord token
		hasLyrics, // true when "lyrics" is in the rendered fields list
		onSyncLyricsSelection, // syncs DOM textarea selection into hook state
		onOpenChordPicker, // opens the chord picker (insert or edit mode)
	} = useSortableGridCells(params);

	return (
		<div>
			<div data-testid="has-lyrics">{String(hasLyrics)}</div>
			<div data-testid="is-editing-chord">{String(isEditingChord)}</div>
			<textarea
				ref={lyricsTextareaRef}
				data-testid="lyrics-textarea"
				defaultValue={LYRICS_VALUE}
				onSelect={onSyncLyricsSelection}
			/>
			<button type="button" data-testid="open-chord-picker" onClick={onOpenChordPicker}>
				Open chord picker
			</button>
		</div>
	);
}

describe("useSortableGridCells — Harness", () => {
	it("renders hasLyrics: true in DOM when lyrics field is included", () => {
		// cleanup() is required: this project cannot auto-register afterEach(cleanup)
		// (no globals:true, and afterEach is disallowed by the linter). Each harness
		// test starts clean by calling cleanup() itself.
		cleanup();
		const { params } = makeParams();

		const rendered = render(<Harness params={params} />);

		expect(within(rendered.container).getByTestId("has-lyrics").textContent).toBe("true");
	});

	it("shows isEditingChord: true when caret is placed inside a chord token", async () => {
		cleanup();
		const { params } = makeParams();
		const rendered = render(<Harness params={params} />);
		const lyricsTextarea = getLyricsTextarea(rendered.container);

		lyricsTextarea.setSelectionRange(CARET_INSIDE_CHORD_INDEX, CARET_INSIDE_CHORD_INDEX);
		fireEvent.select(lyricsTextarea);

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("is-editing-chord").textContent).toBe("true");
		});
	});

	it("calls openChordPicker with initialChordToken and isEditingChord when selection is inside a chord token", () => {
		cleanup();
		const { params, actions } = makeParams();
		const rendered = render(<Harness params={params} />);
		const lyricsTextarea = getLyricsTextarea(rendered.container);

		lyricsTextarea.setSelectionRange(CARET_INSIDE_CHORD_INDEX, CARET_INSIDE_CHORD_INDEX);
		fireEvent.click(within(rendered.container).getByTestId("open-chord-picker"));

		const request = getFirstChordPickerRequest(actions.openChordPicker);
		expect(request.initialChordToken).toBe(CHORD_TOKEN);
		expect(request.isEditingChord).toBe(true);
	});

	it("submitChord in edit mode replaces the chord token via editFieldValue", () => {
		cleanup();
		const { params, actions } = makeParams();
		const rendered = render(<Harness params={params} />);
		const lyricsTextarea = getLyricsTextarea(rendered.container);

		lyricsTextarea.setSelectionRange(CARET_INSIDE_CHORD_INDEX, CARET_INSIDE_CHORD_INDEX);
		fireEvent.click(within(rendered.container).getByTestId("open-chord-picker"));

		const request = getFirstChordPickerRequest(actions.openChordPicker);
		request.submitChord(INSERTED_CHORD);

		expect(actions.editFieldValue).toHaveBeenCalledWith(
			expect.objectContaining({
				slideId: SLIDE_ID,
				field: LYRICS_FIELD,
				value: LYRICS_WITH_REPLACED_CHORD,
			}),
		);
	});
});

describe("useSortableGridCells — renderHook", () => {
	it("hasLyrics is false when lyrics field is not in fields", () => {
		const { params } = makeParams({ fields: [OTHER_FIELD] });

		const { result } = renderHook(() => useSortableGridCells(params));

		expect(result.current.hasLyrics).toBe(false);
	});

	it("hasLyrics is true when lyrics field is included", () => {
		const { params } = makeParams({ fields: [LYRICS_FIELD] });

		const { result } = renderHook(() => useSortableGridCells(params));

		expect(result.current.hasLyrics).toBe(true);
	});

	it("isEditingChord is false initially", () => {
		const { params } = makeParams();

		const { result } = renderHook(() => useSortableGridCells(params));

		expect(result.current.isEditingChord).toBe(false);
	});

	it("onOpenChordPicker calls openChordPicker in insert mode when no chord at selection", async () => {
		const { params, actions } = makeParams();
		const { result } = renderHook(() => useSortableGridCells(params));

		result.current.onOpenChordPicker();

		await waitFor(() => {
			expect(actions.openChordPicker).toHaveBeenCalledOnce();
		});

		const request = getFirstChordPickerRequest(actions.openChordPicker);
		expect(request.initialChordToken).toBeUndefined();
		expect(request.isEditingChord).toBeUndefined();
		expect(typeof request.submitChord).toBe("function");
	});

	it("submitChord inserts chord token at end of lyrics and calls editFieldValue", async () => {
		const { params, actions } = makeParams();
		const { result } = renderHook(() => useSortableGridCells(params));

		result.current.onOpenChordPicker();

		await waitFor(() => {
			expect(actions.openChordPicker).toHaveBeenCalledOnce();
		});

		const request = getFirstChordPickerRequest(actions.openChordPicker);
		request.submitChord(INSERTED_CHORD);

		await waitFor(() => {
			expect(actions.editFieldValue).toHaveBeenCalledWith(
				expect.objectContaining({
					slideId: SLIDE_ID,
					field: LYRICS_FIELD,
					value: LYRICS_WITH_INSERTED_CHORD,
				}),
			);
		});
	});
});
