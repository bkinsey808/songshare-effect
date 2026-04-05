import { cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import { type Slide } from "@/react/song/song-form/song-form-types";
import { ONE, TWO, ZERO } from "@/shared/constants/shared-constants";
import { safeGet } from "@/shared/utils/safe";

import useSlideDetailCard from "./useSlideDetailCard";

vi.mock("@/react/app-store/useAppStore");

const SLIDE_ID = "slide-1";
const OTHER_SLIDE_ID = "slide-2";
const USER_ID = "user-1";
const CREATED_AT = "2026-01-01T00:00:00.000Z";
const IMAGE_ID = "image-1";
const UPDATED_NAME = "Updated Name";
const FIELD_KEY = "lyrics";
const FIELD_VALUE = "Updated lyrics";
const BG_URL = "https://cdn.example.com/image.png";

type HookParams =
	Parameters<typeof useSlideDetailCard> extends [infer FirstParam, ...unknown[]]
		? FirstParam
		: never;

type StoreState = Readonly<{
	imageLibraryEntries: Record<string, ImageLibraryEntry>;
	isImageLibraryLoading: boolean;
}>;

type HookActions = Readonly<{
	openChordPicker: HookParams["openChordPicker"];
	setConfirmingDeleteSlideId: (slideId: string | undefined) => void;
	editSlideName: (params: Readonly<{ slideId: string; newName: string }>) => void;
	editFieldValue: (
		params: Readonly<{
			slideId: string;
			field: string;
			value: string;
		}>,
	) => void;
	toggleBackgroundPicker: (slideId: string) => void;
	selectSlideBackgroundImage: (
		params: Readonly<{
			slideId: string;
			backgroundImageId: string;
			backgroundImageUrl: string;
		}>,
	) => void;
	clearSlideBackgroundImage: (slideId: string) => void;
	moveSlideUp: (index: number) => void;
	moveSlideDown: (index: number) => void;
	deleteSlide: (slideId: string) => void;
	removeSlideOrder: (params: Readonly<{ slideId: string; index?: number }>) => void;
}>;

const SLIDES: Readonly<Record<string, Slide>> = {
	[SLIDE_ID]: {
		slide_name: "Slide One",
		field_data: { lyrics: "hello" },
	},
	[OTHER_SLIDE_ID]: {
		slide_name: "Slide Two",
		field_data: { lyrics: "world" },
	},
};

const DUPLICATE_ORDER = [SLIDE_ID, SLIDE_ID];
const UNIQUE_ORDER = [SLIDE_ID, OTHER_SLIDE_ID];

const IMAGE_LIBRARY_ENTRIES: Record<string, ImageLibraryEntry> = {
	[IMAGE_ID]: {
		user_id: USER_ID,
		image_id: IMAGE_ID,
		created_at: CREATED_AT,
	},
};

const EDIT_NAME_BUTTON = "edit-name";
const MOVE_UP_BUTTON = "move-up";
const CARET_INSIDE_CHORD_INDEX = 8;

/**
 * Resolves the rendered lyrics textarea and narrows it to the expected element type.
 *
 * @param container - Rendered test container holding the harness output
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
 * Returns the first chord-picker request passed to the mocked open handler.
 *
 * @param openChordPicker - Mocked openChordPicker action
 * @returns First submitted picker request
 */
function getFirstOpenChordPickerRequest(
	openChordPicker: HookActions["openChordPicker"],
): HookParams["openChordPicker"] extends (request: infer Request) => void ? Request : never {
	const [firstCallArgs] = vi.mocked(openChordPicker).mock.calls;
	if (firstCallArgs === undefined) {
		throw new TypeError("Expected openChordPicker to be called at least once");
	}

	const [firstRequest] = firstCallArgs;
	return forceCast<
		HookParams["openChordPicker"] extends (request: infer Request) => void ? Request : never
	>(firstRequest);
}

/**
 * Installs deterministic mocked Zustand selector behavior for this test.
 *
 * @param state - Store state exposed to selectors
 * @returns Nothing
 */
function installStore(state: StoreState): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(innerState: StoreState) => unknown>(selector)(state),
	);
}

/**
 * Creates a fresh set of action mocks for one test.
 *
 * @returns Mocked action functions for useSlideDetailCard params
 */
function makeActions(): HookActions {
	return {
		openChordPicker: vi.fn(),
		setConfirmingDeleteSlideId: vi.fn(),
		editSlideName: vi.fn(),
		editFieldValue: vi.fn(),
		toggleBackgroundPicker: vi.fn(),
		selectSlideBackgroundImage: vi.fn(),
		clearSlideBackgroundImage: vi.fn(),
		moveSlideUp: vi.fn(),
		moveSlideDown: vi.fn(),
		deleteSlide: vi.fn(),
		removeSlideOrder: vi.fn(),
	};
}

/**
 * Builds a valid hook params object with overridable values.
 *
 * @param options - Optional action mocks and partial param overrides
 * @returns Hook params and action mocks used to build them
 */
function makeParams(
	options: Readonly<{
		actions?: HookActions;
		overrides?: Partial<HookParams>;
	}> = {},
): Readonly<{ params: HookParams; actions: HookActions }> {
	const actions = options.actions ?? makeActions();
	const params: HookParams = {
		slideId: SLIDE_ID,
		idx: ONE,
		slideOrder: DUPLICATE_ORDER,
		slides: SLIDES,
		confirmingDeleteSlideId: undefined,
		backgroundPickerSlideId: undefined,
		...actions,
		...options.overrides,
	};

	return { params, actions };
}

/**
 * Harness for useSlideDetailCard.
 *
 * Documents hook usage in real JSX by wiring returned handlers and exposing
 * derived state values through test ids.
 *
 * @param params - Fully configured hook parameters
 * @returns Rendered harness UI
 */
function Harness({ params }: Readonly<{ params: HookParams }>): ReactElement {
	const {
		slide,
		isConfirmingDelete,
		canMoveUp,
		lyricsTextareaRef,
		selectedChordToken,
		onEditSlideName,
		onLyricsChange,
		onMoveUp,
		onOpenChordPicker,
		onSyncLyricsSelection,
	} = useSlideDetailCard(params);
	const lyricsValue = safeGet(slide?.field_data ?? {}, "lyrics") ?? "";

	return (
		<div>
			<div data-testid="is-confirming-delete">{String(isConfirmingDelete)}</div>
			<div data-testid="can-move-up">{String(canMoveUp)}</div>
			<div data-testid="lyrics-value">{lyricsValue}</div>
			<div data-testid="is-editing-chord">{String(selectedChordToken !== undefined)}</div>
			<textarea
				ref={lyricsTextareaRef}
				data-testid="lyrics-textarea"
				value={lyricsValue}
				onChange={onLyricsChange}
				onSelect={onSyncLyricsSelection}
				readOnly={false}
			/>
			<button
				type="button"
				data-testid={EDIT_NAME_BUTTON}
				onClick={() => {
					onEditSlideName(UPDATED_NAME);
				}}
			>
				Edit name
			</button>
			<button
				type="button"
				data-testid={MOVE_UP_BUTTON}
				onClick={() => {
					onMoveUp();
				}}
			>
				Move up
			</button>
			<button type="button" data-testid="open-chord-picker" onClick={onOpenChordPicker}>
				Open chord picker
			</button>
		</div>
	);
}

describe("useSlideDetailCard — Harness", () => {
	it("renders derived flags in DOM", () => {
		// Arrange
		cleanup();
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const { params } = makeParams({
			overrides: { confirmingDeleteSlideId: SLIDE_ID, idx: ONE },
		});

		// Act
		const rendered = render(<Harness params={params} />);

		// Assert
		expect(within(rendered.container).getByTestId("is-confirming-delete").textContent).toBe("true");
		expect(within(rendered.container).getByTestId("can-move-up").textContent).toBe("true");
	});

	it("wires onEditSlideName from the hook into a button click", () => {
		// Arrange
		cleanup();
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({ actions });
		const rendered = render(<Harness params={params} />);

		// Act
		fireEvent.click(within(rendered.container).getByTestId(EDIT_NAME_BUTTON));

		// Assert
		expect(actions.editSlideName).toHaveBeenCalledWith({
			slideId: SLIDE_ID,
			newName: UPDATED_NAME,
		});
	});

	it("opens the chord picker in edit mode when the lyrics selection is inside a chord token", () => {
		// Arrange
		cleanup();
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({
			actions,
			overrides: {
				slides: {
					[SLIDE_ID]: {
						slide_name: "Slide One",
						field_data: { lyrics: "Hello [C -]" },
					},
				},
			},
		});
		const rendered = render(<Harness params={params} />);
		const lyricsTextarea = getLyricsTextarea(rendered.container);

		// Act
		lyricsTextarea.setSelectionRange(CARET_INSIDE_CHORD_INDEX, CARET_INSIDE_CHORD_INDEX);
		fireEvent.select(lyricsTextarea);
		fireEvent.click(within(rendered.container).getByTestId("open-chord-picker"));

		// Assert
		const firstCall = getFirstOpenChordPickerRequest(actions.openChordPicker);
		expect(firstCall?.initialChordToken).toBe("[C -]");
		expect(firstCall?.isEditingChord).toBe(true);
		expect(typeof firstCall?.submitChord).toBe("function");
	});
});

describe("useSlideDetailCard — renderHook", () => {
	it("returns duplicate styling and true duplicate flag for duplicated slide ids", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const { params } = makeParams({
			overrides: { slideOrder: DUPLICATE_ORDER },
		});

		// Act
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Assert
		expect(result.current.isDuplicate).toBe(true);
		expect(result.current.duplicateTintProps).toStrictEqual(
			expect.objectContaining({ "data-duplicate-tint": "" }),
		);
	});

	it("returns non-duplicate state for unique slide ids", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const { params } = makeParams({
			overrides: { slideOrder: UNIQUE_ORDER },
		});

		// Act
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Assert
		expect(result.current.isDuplicate).toBe(false);
		expect(result.current.duplicateTintProps).toBeUndefined();
	});

	it("derives move flags from idx and slide order length", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const { params } = makeParams({
			overrides: {
				idx: ZERO,
				slideOrder: UNIQUE_ORDER,
			},
		});

		// Act
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Assert
		expect(result.current.canMoveUp).toBe(false);
		expect(result.current.canMoveDown).toBe(true);
		expect(result.current.hasMultipleSlides).toBe(true);
	});

	it("exposes image library selectors from useAppStore", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: true,
		});
		const { params } = makeParams();

		// Act
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Assert
		expect(result.current.isImageLibraryLoading).toBe(true);
		expect(result.current.imageLibraryEntryList).toHaveLength(ONE);
	});

	it("binds onEditFieldValue to slide-aware payload", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({ actions });
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Act
		result.current.onEditFieldValue({ field: FIELD_KEY, value: FIELD_VALUE });

		// Assert
		expect(actions.editFieldValue).toHaveBeenCalledWith({
			slideId: SLIDE_ID,
			field: FIELD_KEY,
			value: FIELD_VALUE,
		});
	});

	it("binds onSelectBackgroundImage to slide-aware payload", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({ actions });
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Act
		result.current.onSelectBackgroundImage({
			backgroundImageId: IMAGE_ID,
			backgroundImageUrl: BG_URL,
		});

		// Assert
		expect(actions.selectSlideBackgroundImage).toHaveBeenCalledWith({
			slideId: SLIDE_ID,
			backgroundImageId: IMAGE_ID,
			backgroundImageUrl: BG_URL,
		});
	});

	it("binds onConfirmDelete to delete and clear confirmation state", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({ actions, overrides: { idx: TWO } });
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Act
		result.current.onConfirmDelete();

		// Assert
		expect(actions.deleteSlide).toHaveBeenCalledWith(SLIDE_ID);
		expect(actions.setConfirmingDeleteSlideId).toHaveBeenCalledWith(undefined);
	});

	it("binds onMoveUp to the current index", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({ actions, overrides: { idx: TWO } });
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Act
		result.current.onMoveUp();

		// Assert
		expect(actions.moveSlideUp).toHaveBeenCalledWith(TWO);
	});

	it("binds onRemoveFromPresentation to slide id and index", () => {
		// Arrange
		installStore({
			imageLibraryEntries: IMAGE_LIBRARY_ENTRIES,
			isImageLibraryLoading: false,
		});
		const actions = makeActions();
		const { params } = makeParams({ actions, overrides: { idx: TWO } });
		const { result } = renderHook(() => useSlideDetailCard(params));

		// Act
		result.current.onRemoveFromPresentation();

		// Assert
		expect(actions.removeSlideOrder).toHaveBeenCalledWith({ slideId: SLIDE_ID, index: TWO });
	});
});
