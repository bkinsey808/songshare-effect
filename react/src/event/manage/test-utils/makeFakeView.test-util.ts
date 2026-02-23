import type useEventView from "@/react/event/view/useEventView";

/**
 * Fake data for `useEventView`.
 *
 * @param overrides - partial payload to merge
 */
export default function makeFakeView(
	overrides: Partial<ReturnType<typeof useEventView>> = {},
): ReturnType<typeof useEventView> {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const base: ReturnType<typeof useEventView> = {
		activeSlidePosition: 2,
		activeSongTotalSlides: 5,
	} as ReturnType<typeof useEventView>;
	return { ...base, ...overrides };
}
