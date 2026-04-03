import { act, cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import useAutoExpandingTextarea from "./useAutoExpandingTextarea";

const LINE_HEIGHT_PX = "20px";
const MIN_ROWS = 2;
const MAX_ROWS = 4;
const INITIAL_VALUE = "initial";
const UPDATED_VALUE = "updated";
const SMALL_SCROLL_HEIGHT = 30;
const MEDIUM_SCROLL_HEIGHT = 60;
const LARGE_SCROLL_HEIGHT = 120;
const PARENT_HEIGHT = 90;
const LARGE_HEIGHT_PX = "80px";
const MEDIUM_HEIGHT_PX = "60px";
const PARENT_HEIGHT_PX = "90px";
const EXPANDED_HEIGHT_PX = "120px";
const HIDDEN_OVERFLOW = "hidden";
const AUTO_OVERFLOW = "auto";
const EMPTY_STRING = "";
const SCROLL_EVENT = "scroll";
const FIRST_CALL_INDEX = 0;
const HANDLER_ARGUMENT_INDEX = 1;

type HookProps = Readonly<{
	value: string;
	minRows: number;
	maxRows: number;
	fillParentHeight: boolean;
	growWithContent: boolean;
	resizeOnExternalValueChange: boolean;
}>;

const DEFAULT_HOOK_PROPS: HookProps = {
	value: INITIAL_VALUE,
	minRows: MIN_ROWS,
	maxRows: MAX_ROWS,
	fillParentHeight: false,
	growWithContent: false,
	resizeOnExternalValueChange: true,
};

/**
 * Stubs `getComputedStyle()` so textarea sizing tests use a stable line-height value.
 */
function mockLineHeight(): void {
	vi.spyOn(globalThis, "getComputedStyle").mockReturnValue(
		forceCast<CSSStyleDeclaration>({ lineHeight: LINE_HEIGHT_PX }),
	);
}

/**
 * Defines a configurable readonly numeric DOM property for jsdom-based layout tests.
 *
 * @param target - element that should expose the mocked property
 * @param property - DOM layout property to override
 * @param value - numeric value returned whenever the property is read
 */
function defineReadOnlyNumberProperty({
	target,
	property,
	value,
}: Readonly<{
	target: HTMLDivElement | HTMLTextAreaElement;
	property: "clientHeight" | "scrollHeight";
	value: number;
}>): void {
	Object.defineProperty(target, property, {
		configurable: true,
		get: () => value,
	});
}

/**
 * Installs mocked layout measurements on a textarea and, optionally, its parent container.
 *
 * @param textarea - textarea element whose sizing measurements should be stubbed
 * @param scrollHeight - scroll height value returned for the textarea content
 * @param parentHeight - optional parent `clientHeight` used for fill-parent-height scenarios
 */
function installTextareaMeasurements({
	textarea,
	scrollHeight,
	parentHeight,
}: Readonly<{
	textarea: HTMLTextAreaElement;
	scrollHeight: number;
	parentHeight?: number;
}>): void {
	defineReadOnlyNumberProperty({
		target: textarea,
		property: "scrollHeight",
		value: scrollHeight,
	});

	if (parentHeight !== undefined && textarea.parentElement instanceof HTMLDivElement) {
		defineReadOnlyNumberProperty({
			target: textarea.parentElement,
			property: "clientHeight",
			value: parentHeight,
		});
	}
}

/**
 * Creates and mounts a parent/textarea pair so hook tests can control layout measurements directly.
 *
 * @returns mounted parent container and textarea element used by the test
 */
function makeStandaloneTextarea(): Readonly<{
	parent: HTMLDivElement;
	textarea: HTMLTextAreaElement;
}> {
	const parent = document.createElement("div");
	const textarea = document.createElement("textarea");
	parent.append(textarea);
	document.body.append(parent);

	return { parent, textarea };
}

/**
 * Assigns a concrete textarea element to the hook's mutable ref inside a test.
 *
 * @param ref - hook-managed ref object that should point at the textarea
 * @param textarea - textarea element instance to assign into the ref
 */
function assignTextareaRef({
	ref,
	textarea,
}: Readonly<{
	ref: React.RefObject<HTMLTextAreaElement | null>;
	textarea: HTMLTextAreaElement;
}>): void {
	forceCast<{ current: HTMLTextAreaElement | null }>(ref).current = textarea;
}

/**
 * Harness for useAutoExpandingTextarea — "Documentation by Harness".
 *
 * Shows how the hook integrates into a real textarea:
 * - The returned ref is attached to the textarea element
 * - The focus and input handlers are wired to DOM events
 * - Every hook option is passed as a prop so tests document the supported modes
 */
function Harness(props: HookProps): ReactElement {
	const { textareaRef, handleFocus, handleInput } = useAutoExpandingTextarea(props);

	return (
		<div>
			<textarea
				ref={textareaRef}
				data-testid="textarea"
				value={props.value}
				readOnly
				onFocus={handleFocus}
				onInput={handleInput}
			/>
			<div data-testid="value">{props.value}</div>
			<div data-testid="min-rows">{String(props.minRows)}</div>
			<div data-testid="max-rows">{String(props.maxRows)}</div>
			<div data-testid="fill-parent-height">{String(props.fillParentHeight)}</div>
			<div data-testid="grow-with-content">{String(props.growWithContent)}</div>
			<div data-testid="resize-on-external-value-change">
				{String(props.resizeOnExternalValueChange)}
			</div>
		</div>
	);
}

describe("useAutoExpandingTextarea — Harness", () => {
	it("focus applies the sizing behavior through the returned ref and focus handler", () => {
		// Arrange
		cleanup();
		vi.restoreAllMocks();
		mockLineHeight();
		const rendered = render(<Harness {...DEFAULT_HOOK_PROPS} />);
		const textarea = forceCast<HTMLTextAreaElement>(
			within(rendered.container).getByTestId("textarea"),
		);
		installTextareaMeasurements({
			textarea,
			scrollHeight: MEDIUM_SCROLL_HEIGHT,
		});

		// Act
		fireEvent.focus(textarea);

		// Assert
		expect(textarea.style.height).toBe(MEDIUM_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		expect(within(rendered.container).getByTestId("value").textContent).toBe(INITIAL_VALUE);
	});

	it("input reapplies sizing after the content measurements change", () => {
		// Arrange
		cleanup();
		vi.restoreAllMocks();
		mockLineHeight();
		const rendered = render(<Harness {...DEFAULT_HOOK_PROPS} />);
		const textarea = forceCast<HTMLTextAreaElement>(
			within(rendered.container).getByTestId("textarea"),
		);
		installTextareaMeasurements({
			textarea,
			scrollHeight: LARGE_SCROLL_HEIGHT,
		});

		// Act
		fireEvent.input(textarea);

		// Assert
		expect(textarea.style.height).toBe(LARGE_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(AUTO_OVERFLOW);
	});

	it("scroll catches up deferred external value changes", () => {
		// Arrange
		cleanup();
		vi.restoreAllMocks();
		mockLineHeight();
		const rendered = render(
			<Harness {...DEFAULT_HOOK_PROPS} resizeOnExternalValueChange={false} />,
		);
		const textarea = forceCast<HTMLTextAreaElement>(
			within(rendered.container).getByTestId("textarea"),
		);
		installTextareaMeasurements({
			textarea,
			scrollHeight: LARGE_SCROLL_HEIGHT,
		});
		rendered.rerender(
			<Harness {...DEFAULT_HOOK_PROPS} value={UPDATED_VALUE} resizeOnExternalValueChange={false} />,
		);

		// Act
		act(() => {
			globalThis.dispatchEvent(new Event(SCROLL_EVENT));
		});

		// Assert
		expect(textarea.style.height).toBe(LARGE_HEIGHT_PX);
		expect(
			within(rendered.container).getByTestId("resize-on-external-value-change").textContent,
		).toBe("false");
	});
});

describe("useAutoExpandingTextarea — renderHook", () => {
	it("resizes immediately on controlled value changes when external sync is enabled", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { result, rerender } = renderHook((props: HookProps) => useAutoExpandingTextarea(props), {
			initialProps: DEFAULT_HOOK_PROPS,
		});
		const { parent, textarea } = makeStandaloneTextarea();
		installTextareaMeasurements({
			textarea,
			scrollHeight: MEDIUM_SCROLL_HEIGHT,
		});
		assignTextareaRef({ ref: result.current.textareaRef, textarea });

		// Act
		rerender({
			...DEFAULT_HOOK_PROPS,
			value: UPDATED_VALUE,
		});

		// Assert
		expect(textarea.style.height).toBe(MEDIUM_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		parent.remove();
	});

	it("skips controlled value resize when external sync is disabled and the textarea is inactive", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { result, rerender } = renderHook((props: HookProps) => useAutoExpandingTextarea(props), {
			initialProps: {
				...DEFAULT_HOOK_PROPS,
				resizeOnExternalValueChange: false,
			},
		});
		const { parent, textarea } = makeStandaloneTextarea();
		installTextareaMeasurements({
			textarea,
			scrollHeight: MEDIUM_SCROLL_HEIGHT,
		});
		assignTextareaRef({ ref: result.current.textareaRef, textarea });

		// Act
		rerender({
			...DEFAULT_HOOK_PROPS,
			value: UPDATED_VALUE,
			resizeOnExternalValueChange: false,
		});

		// Assert
		expect(textarea.style.height).toBe(EMPTY_STRING);
		expect(textarea.style.overflowY).toBe(EMPTY_STRING);
		parent.remove();
	});

	it("handleInput grows to the parent height when fillParentHeight is enabled", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { result } = renderHook((props: HookProps) => useAutoExpandingTextarea(props), {
			initialProps: {
				...DEFAULT_HOOK_PROPS,
				fillParentHeight: true,
			},
		});
		const { parent, textarea } = makeStandaloneTextarea();
		installTextareaMeasurements({
			textarea,
			scrollHeight: SMALL_SCROLL_HEIGHT,
			parentHeight: PARENT_HEIGHT,
		});
		assignTextareaRef({ ref: result.current.textareaRef, textarea });

		// Act
		act(() => {
			result.current.handleInput();
		});

		// Assert
		expect(textarea.style.height).toBe(PARENT_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		parent.remove();
	});

	it("handleFocus honors growWithContent by removing the maxRows cap", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { result } = renderHook((props: HookProps) => useAutoExpandingTextarea(props), {
			initialProps: {
				...DEFAULT_HOOK_PROPS,
				growWithContent: true,
			},
		});
		const { parent, textarea } = makeStandaloneTextarea();
		installTextareaMeasurements({
			textarea,
			scrollHeight: LARGE_SCROLL_HEIGHT,
		});
		assignTextareaRef({ ref: result.current.textareaRef, textarea });

		// Act
		act(() => {
			result.current.handleFocus();
		});

		// Assert
		expect(textarea.style.height).toBe(EXPANDED_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		parent.remove();
	});

	it("removes the deferred scroll listener on unmount", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
		const removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");
		const { unmount } = renderHook((props: HookProps) => useAutoExpandingTextarea(props), {
			initialProps: {
				...DEFAULT_HOOK_PROPS,
				resizeOnExternalValueChange: false,
			},
		});
		const scrollHandler = forceCast<EventListener>(
			addEventListenerSpy.mock.calls[FIRST_CALL_INDEX]?.[HANDLER_ARGUMENT_INDEX],
		);

		// Act
		unmount();

		// Assert
		expect(addEventListenerSpy).toHaveBeenCalledWith(SCROLL_EVENT, scrollHandler, {
			passive: true,
		});
		expect(removeEventListenerSpy).toHaveBeenCalledWith(SCROLL_EVENT, scrollHandler);
	});
});
