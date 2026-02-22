import { renderHook, type RenderHookResult } from "@testing-library/react";
import { Effect } from "effect";
import { useState, type RefObject } from "react";
import { describe, expect, it, vi } from "vitest";

import postJson from "@/shared/fetch/postJson";

import type { ActionState } from "./ActionState.type";

import useEventAutosave from "./useEventAutosave";

vi.mock("@/shared/fetch/postJson");

describe("useEventAutosave", () => {
	// result.current should expose the hook return value
	type HookResult = ReturnType<typeof useEventAutosave>;
	type SetupReturn = RenderHookResult<HookResult, unknown>;

	function setup(): SetupReturn {
		const event_slug = "e1";
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as void));
		const currentEventIdRef = { current: "event-123" } as RefObject<string | undefined>;
		const latestSlidePositionRef = { current: undefined } as RefObject<number | undefined>;

		return renderHook<HookResult, unknown>(() => {
			const [, setActionState] = useState<ActionState>({
				loadingKey: undefined,
				error: undefined,
				success: undefined,
			});
			return useEventAutosave({
				event_slug,
				fetchEventBySlug,
				currentEventIdRef,
				latestSlidePositionRef,
				setActionState,
			});
		});
	}

	it("immediately sends song save when updateActiveSong is called", () => {
		const { result } = setup();
		const mockPost = vi.mocked(postJson);
		mockPost.mockResolvedValue(undefined);

		result.current.updateActiveSong("song-xyz");

		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: "event-123",
				active_song_id: "song-xyz",
			}),
		);
	});

	it("sends slide save when updateActiveSlidePosition is called", () => {
		const { result } = setup();
		const mockPost = vi.mocked(postJson);
		mockPost.mockResolvedValue(undefined);

		const slidePos = 7;
		result.current.updateActiveSlidePosition(slidePos);

		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: "event-123",
				active_slide_position: slidePos,
			}),
		);
	});
});
