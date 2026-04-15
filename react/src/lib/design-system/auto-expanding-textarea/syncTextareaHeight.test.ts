import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import syncTextareaHeight from "./syncTextareaHeight";

const LINE_HEIGHT_PX = "20px";
const MIN_ROWS = 2;
const MAX_ROWS = 4;
const SMALL_SCROLL_HEIGHT = 30;
const LARGE_SCROLL_HEIGHT = 120;
const PARENT_HEIGHT = 90;
const SMALL_HEIGHT_PX = "40px";
const LARGE_HEIGHT_PX = "80px";
const PARENT_HEIGHT_PX = "90px";
const EXPANDED_HEIGHT_PX = "120px";
const HIDDEN_OVERFLOW = "hidden";
const AUTO_OVERFLOW = "auto";

/**
 * Stubs `getComputedStyle()` so textarea sizing tests use a stable line-height value.
 *
 * @returns void
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
 * @returns void
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
 * Create a DOM fixture containing a parent `div` and a `textarea` element.
 *
 * @returns An object with `parent` and `textarea` elements for tests
 */
function makeTextareaFixture(): Readonly<{
	parent: HTMLDivElement;
	textarea: HTMLTextAreaElement;
}> {
	const parent = document.createElement("div");
	const textarea = document.createElement("textarea");
	parent.append(textarea);
	document.body.append(parent);

	return { parent, textarea };
}

describe("syncTextareaHeight", () => {
	it("uses the minimum height when content is shorter than the minimum rows", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { parent, textarea } = makeTextareaFixture();
		defineReadOnlyNumberProperty({
			target: textarea,
			property: "scrollHeight",
			value: SMALL_SCROLL_HEIGHT,
		});

		// Act
		syncTextareaHeight({
			textarea,
			minRows: MIN_ROWS,
			maxRows: MAX_ROWS,
			fillParentHeight: false,
			growWithContent: false,
		});

		// Assert
		expect(textarea.style.height).toBe(SMALL_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		parent.remove();
	});

	it("uses the parent height when fillParentHeight is enabled and the parent is taller", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { parent, textarea } = makeTextareaFixture();
		defineReadOnlyNumberProperty({
			target: textarea,
			property: "scrollHeight",
			value: SMALL_SCROLL_HEIGHT,
		});
		defineReadOnlyNumberProperty({
			target: parent,
			property: "clientHeight",
			value: PARENT_HEIGHT,
		});

		// Act
		syncTextareaHeight({
			textarea,
			minRows: MIN_ROWS,
			maxRows: MAX_ROWS,
			fillParentHeight: true,
			growWithContent: false,
		});

		// Assert
		expect(textarea.style.height).toBe(PARENT_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		parent.remove();
	});

	it("caps the height at maxRows and enables overflow when content exceeds the cap", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { parent, textarea } = makeTextareaFixture();
		defineReadOnlyNumberProperty({
			target: textarea,
			property: "scrollHeight",
			value: LARGE_SCROLL_HEIGHT,
		});

		// Act
		syncTextareaHeight({
			textarea,
			minRows: MIN_ROWS,
			maxRows: MAX_ROWS,
			fillParentHeight: false,
			growWithContent: false,
		});

		// Assert
		expect(textarea.style.height).toBe(LARGE_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(AUTO_OVERFLOW);
		parent.remove();
	});

	it("ignores maxRows when growWithContent is enabled", () => {
		// Arrange
		vi.restoreAllMocks();
		mockLineHeight();
		const { parent, textarea } = makeTextareaFixture();
		defineReadOnlyNumberProperty({
			target: textarea,
			property: "scrollHeight",
			value: LARGE_SCROLL_HEIGHT,
		});

		// Act
		syncTextareaHeight({
			textarea,
			minRows: MIN_ROWS,
			maxRows: MAX_ROWS,
			fillParentHeight: false,
			growWithContent: true,
		});

		// Assert
		expect(textarea.style.height).toBe(EXPANDED_HEIGHT_PX);
		expect(textarea.style.overflowY).toBe(HIDDEN_OVERFLOW);
		parent.remove();
	});
});
