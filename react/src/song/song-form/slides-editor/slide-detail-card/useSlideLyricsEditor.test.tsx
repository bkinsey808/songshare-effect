import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Slide, SongFormChordPickerRequest } from "@/react/song/song-form/song-form-types";

import useSlideLyricsEditor from "./useSlideLyricsEditor";

const SLIDE_NAME = "Slide One";
const LYRICS_FIELD = "lyrics";
const LYRICS_VALUE = "Hello [C -]";
const UPDATED_LYRICS_VALUE = "Updated lyrics";
const CHORD_TOKEN = "[C -]";
const INSERTED_CHORD = "[G]";
const LYRICS_WITH_INSERTED_CHORD = `${LYRICS_VALUE}${INSERTED_CHORD}`;
const LYRICS_WITH_REPLACED_CHORD = `Hello ${INSERTED_CHORD}`;
const CARET_INSIDE_CHORD_INDEX = 8;

type HookParams =
	Parameters<typeof useSlideLyricsEditor> extends [infer FirstParam, ...unknown[]]
		? FirstParam
		: never;

type HookActions = Readonly<{
	openChordPicker: HookParams["openChordPicker"];
	onEditFieldValue: HookParams["onEditFieldValue"];
}>;

const SLIDE: Slide = {
	slide_name: SLIDE_NAME,
	field_data: { [LYRICS_FIELD]: LYRICS_VALUE },
};

/**
 * Create action mocks used by the hook tests.
 *
 * @returns Mocked hook action callbacks
 */
function makeActions(): HookActions {
	return {
		openChordPicker: vi.fn(),
		onEditFieldValue: vi.fn(),
	};
}

/**
 * Create default hook params and action mocks for the hook under test.
 *
 * @param overrides - Partial parameter overrides
 * @returns Hook params plus the action mocks used to build them
 */
function makeParams(
	overrides: Partial<HookParams> = {},
): Readonly<{ params: HookParams; actions: HookActions }> {
	const actions = makeActions();
	const params: HookParams = {
		slide: SLIDE,
		...actions,
		...overrides,
	};

	return { params, actions };
}

/**
 * Returns the first chord-picker request sent to the mock open handler.
 *
 * @param openChordPicker - Mocked chord-picker opener
 * @returns First request passed to the open handler
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
 * Resolve the rendered lyrics textarea and narrow it to the expected type.
 *
 * @param container - Rendered test container
 * @returns Lyrics textarea element
 */
function getLyricsTextarea(container: HTMLElement): HTMLTextAreaElement {
	const lyricsTextarea = within(container).getByTestId("lyrics-textarea");
	if (!(lyricsTextarea instanceof HTMLTextAreaElement)) {
		throw new TypeError("Expected lyrics textarea to be an HTMLTextAreaElement");
	}

	return lyricsTextarea;
}

/**
 * Harness for useSlideLyricsEditor.
 *
 * Shows how the extracted lyrics-editor hook integrates into a slide detail UI:
 * - a textarea wired to the returned ref and selection sync handler
 * - a button wired to the chord-picker opener
 * - derived chord-editing state rendered for assertions
 *
 * @param params - Fully configured hook parameters
 * @returns Rendered harness UI
 */
function Harness({ params }: Readonly<{ params: HookParams }>): ReactElement {
	const {
		lyricsTextareaRef,
		selectedChordToken,
		onLyricsChange,
		onOpenChordPicker,
		onSyncLyricsSelection,
	} = useSlideLyricsEditor(params);
	const lyricsValue = params.slide?.field_data[LYRICS_FIELD] ?? "";

	return (
		<div>
			<div data-testid="is-editing-chord">{String(selectedChordToken !== undefined)}</div>
			<textarea
				ref={lyricsTextareaRef}
				data-testid="lyrics-textarea"
				defaultValue={lyricsValue}
				onChange={onLyricsChange}
				onSelect={onSyncLyricsSelection}
			/>
			<button type="button" data-testid="open-chord-picker" onClick={onOpenChordPicker}>
				Open chord picker
			</button>
		</div>
	);
}

describe("useSlideLyricsEditor — Harness", () => {
	it("shows chord edit mode when the textarea selection is inside a chord token", async () => {
		// cleanup() is required: this project cannot auto-register afterEach(cleanup)
		// (no globals:true, and afterEach is disallowed by the linter). Each harness
		// test starts clean by calling cleanup() itself.
		cleanup();
		const { params } = makeParams();

		// Arrange
		const rendered = render(<Harness params={params} />);
		const lyricsTextarea = getLyricsTextarea(rendered.container);

		// Act
		lyricsTextarea.setSelectionRange(CARET_INSIDE_CHORD_INDEX, CARET_INSIDE_CHORD_INDEX);
		fireEvent.select(lyricsTextarea);

		// Assert
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("is-editing-chord").textContent).toBe("true");
		});
	});

	it("wires textarea changes through to onEditFieldValue", () => {
		cleanup();
		const { params, actions } = makeParams();

		// Arrange
		const rendered = render(<Harness params={params} />);

		// Act
		fireEvent.change(getLyricsTextarea(rendered.container), {
			target: { value: UPDATED_LYRICS_VALUE, selectionStart: 2, selectionEnd: 2 },
		});

		// Assert
		expect(actions.onEditFieldValue).toHaveBeenCalledWith({
			field: LYRICS_FIELD,
			value: UPDATED_LYRICS_VALUE,
		});
	});

	it("opens the chord picker in edit mode when the selection is inside a chord token", () => {
		cleanup();
		const { params, actions } = makeParams();

		// Arrange
		const rendered = render(<Harness params={params} />);
		const lyricsTextarea = getLyricsTextarea(rendered.container);
		lyricsTextarea.setSelectionRange(CARET_INSIDE_CHORD_INDEX, CARET_INSIDE_CHORD_INDEX);

		// Act
		fireEvent.click(within(rendered.container).getByTestId("open-chord-picker"));

		// Assert
		const request = getFirstChordPickerRequest(actions.openChordPicker);
		expect(request.initialChordToken).toBe(CHORD_TOKEN);
		expect(request.isEditingChord).toBe(true);
		expect(typeof request.submitChord).toBe("function");
	});
});

describe("useSlideLyricsEditor — renderHook", () => {
	it("selectedChordToken is undefined on initial render", () => {
		const { params } = makeParams();

		// Arrange + Act
		const { result } = renderHook(() => useSlideLyricsEditor(params));

		// Assert — no Act: verifying initial render state only
		expect(result.current.selectedChordToken).toBeUndefined();
	});

	it("opens the chord picker in insert mode when there is no active selection", async () => {
		const { params, actions } = makeParams();

		// Arrange + Act
		const { result } = renderHook(() => useSlideLyricsEditor(params));
		result.current.onOpenChordPicker();

		// Assert
		await waitFor(() => {
			expect(actions.openChordPicker).toHaveBeenCalledOnce();
		});

		const request = getFirstChordPickerRequest(actions.openChordPicker);
		expect(request.initialChordToken).toBeUndefined();
		expect(request.isEditingChord).toBeUndefined();
		expect(typeof request.submitChord).toBe("function");
	});

	it("submitChord inserts a token at the end of the lyrics in insert mode", async () => {
		const { params, actions } = makeParams();

		// Arrange
		const { result } = renderHook(() => useSlideLyricsEditor(params));

		// Act
		result.current.onOpenChordPicker();

		// Assert
		await waitFor(() => {
			expect(actions.openChordPicker).toHaveBeenCalledOnce();
		});

		const request = getFirstChordPickerRequest(actions.openChordPicker);

		// Act
		request.submitChord(INSERTED_CHORD);

		// Assert
		await waitFor(() => {
			expect(actions.onEditFieldValue).toHaveBeenCalledWith({
				field: LYRICS_FIELD,
				value: LYRICS_WITH_INSERTED_CHORD,
			});
		});
	});

	it("submitChord is a no-op when the current slide is undefined", async () => {
		const { params, actions } = makeParams({ slide: undefined });

		// Arrange
		const { result } = renderHook(() => useSlideLyricsEditor(params));

		// Act
		result.current.onOpenChordPicker();

		// Assert
		await waitFor(() => {
			expect(actions.openChordPicker).toHaveBeenCalledOnce();
		});

		const request = getFirstChordPickerRequest(actions.openChordPicker);

		// Act
		request.submitChord(INSERTED_CHORD);

		// Assert
		await waitFor(() => {
			expect(actions.onEditFieldValue).not.toHaveBeenCalled();
		});
	});

	it("submitChord replaces the active chord token in edit mode", async () => {
		const { params, actions } = makeParams();

		// Arrange
		const { result } = renderHook(() => useSlideLyricsEditor(params));
		result.current.lyricsTextareaRef.current = document.createElement("textarea");
		result.current.lyricsTextareaRef.current.value = LYRICS_VALUE;
		result.current.lyricsTextareaRef.current.setSelectionRange(
			CARET_INSIDE_CHORD_INDEX,
			CARET_INSIDE_CHORD_INDEX,
		);

		// Act
		result.current.onOpenChordPicker();

		// Assert
		await waitFor(() => {
			expect(actions.openChordPicker).toHaveBeenCalledOnce();
		});

		const request = getFirstChordPickerRequest(actions.openChordPicker);

		// Act
		request.submitChord(INSERTED_CHORD);

		// Assert
		await waitFor(() => {
			expect(actions.onEditFieldValue).toHaveBeenCalledWith({
				field: LYRICS_FIELD,
				value: LYRICS_WITH_REPLACED_CHORD,
			});
		});
	});
});
