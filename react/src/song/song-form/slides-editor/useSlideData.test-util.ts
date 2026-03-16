import { expect } from "vitest";

const CALL_INDEX = 0;
const ARG_INDEX = 0;

/**
 * Asserts setSlides was called with slides containing the expected addSlide shape.
 * Extracted to test-util to avoid no-unsafe-assignment from Vitest matchers in test files.
 */
export function expectSetSlidesAddSlideShape(setSlides: { mock: { calls: unknown[][] } }): void {
	/* oxlint-disable-next-line typescript/no-unsafe-assignment -- mock.calls typed as any[][] */
	const arg = setSlides.mock.calls[CALL_INDEX]?.[ARG_INDEX];
	expect(arg).toMatchObject({
		"new-id": { slide_name: "Slide 2", field_data: { lyrics: "" } },
	});
}

/**
 * Asserts setSlides was called with slides containing the expected duplicateSlide shape.
 * Extracted to test-util to avoid no-unsafe-assignment from Vitest matchers in test files.
 */
export function expectSetSlidesDuplicateSlideShape(setSlides: {
	mock: { calls: unknown[][] };
}): void {
	/* oxlint-disable-next-line typescript/no-unsafe-assignment -- mock.calls typed as any[][] */
	const arg = setSlides.mock.calls[CALL_INDEX]?.[ARG_INDEX];
	expect(arg).toMatchObject({
		"dup-id": { slide_name: "Slide 2", field_data: { lyrics: "content" } },
	});
}
