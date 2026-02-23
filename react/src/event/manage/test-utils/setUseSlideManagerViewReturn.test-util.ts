import type { UseSlideManagerViewResult } from "@/react/event/manage/slide/useSlideManagerView";

import { getMockFn } from "@/react/event/manage/test-utils/mockUseSlideManagerView.test-util";

/**
 * Helper for tests to set what `useSlideManagerView` should return.
 *
 * Must be called after `mockUseSlideManagerView()` has been invoked.
 * Sets the return value for the mock.
 */
export default function setUseSlideManagerViewReturn(val: UseSlideManagerViewResult): void {
	const mockFn = getMockFn();
	if (!mockFn) {
		throw new Error("setUseSlideManagerViewReturn: mockUseSlideManagerView() must be called first");
	}
	mockFn.mockReturnValue(val);
}
