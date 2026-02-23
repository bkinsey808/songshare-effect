import { vi } from "vitest";

import type useEventManageView from "@/react/event/manage/event-manage-view/useEventManageView";

/**
 * Create a minimal fake return value for `useEventManageView`.
 *
 * @param overrides - partial properties to merge into the default fake
 */
export default function makeUseManageView(
	overrides: Partial<ReturnType<typeof useEventManageView>> = {},
): ReturnType<typeof useEventManageView> {
	// using an `unknown` cast here keeps the implementation simple while still
	// allowing callers to treat the result as the correct typed shape.
	const base = {
		canManageEvent: false,
		participants: [],
		eventPublic: { active_playlist_id: "p1", active_song_id: "s1" },
		updateActiveSong: vi.fn(),
		updateActiveSlidePosition: vi.fn(),
	};
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return { ...base, ...overrides } as unknown as ReturnType<typeof useEventManageView>;
}
