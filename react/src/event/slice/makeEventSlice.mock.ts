import { vi } from "vitest";

import type { EventSlice } from "@/react/event/slice/EventSlice.type";

import forceCast from "@/react/lib/test-utils/forceCast";

/**
 * Returns a getter that provides a minimal, test-friendly `EventSlice`.
 *
 * The returned function yields an object with the same public API as the
 * real slice but with no-op implementations and `vi.fn()` spies where
 * appropriate. Use this when tests only need a stable, lightweight slice
 * instance without invoking real effects or network calls.
 *
 * @returns getter function that returns a stubbed `EventSlice` suitable for
 * unit tests
 */
export default function makeEventSlice(): () => EventSlice {
	const stub = {
		currentEvent: undefined,
		isEventLoading: false,
		eventError: undefined,
		isEventSaving: false,
		fetchEventBySlug: (_slug: string): unknown => ({}) as unknown,
		saveEvent: (_req: unknown): unknown => ({}) as unknown,
		joinEvent: (_id: string): unknown => ({}) as unknown,
		leaveEvent: (_id: string, _userId: string): unknown => ({}) as unknown,
		clearCurrentEvent: (): void => undefined,
		setCurrentEvent: vi.fn(),
		setEvents: vi.fn(),
		setParticipants: vi.fn(),
		setEventLoading: vi.fn(),
		setEventError: vi.fn(),
		setEventSaving: vi.fn(),
	};
	return () => forceCast<EventSlice>(stub);
}
