import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import postJson from "@/shared/fetch/postJson";

import type { ActionState } from "./ActionState.type";

import useEventAutosave from "./useEventAutosave";

vi.mock("@/shared/fetch/postJson");

describe("useEventAutosave", () => {
	// oxlint-disable-next-line typescript-eslint/explicit-function-return-type
	function setup() {
		const event_slug = "e1";
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as void));
		// oxlint-disable-next-line typescript-eslint/no-deprecated
		const currentEventIdRef = { current: "event-123" } as React.MutableRefObject<
			string | undefined
		>;
		// oxlint-disable-next-line typescript-eslint/no-deprecated
		const latestSlidePositionRef = { current: undefined } as React.MutableRefObject<
			number | undefined
		>;

		return renderHook(() => {
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

		// oxlint-disable-next-line no-magic-numbers
		result.current.updateActiveSlidePosition(7);

		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				event_id: "event-123",
				active_slide_position: 7,
			}),
		);
	});
});
