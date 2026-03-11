import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useEventDataSync from "./useEventDataSync";

describe("useEventDataSync", () => {
	it("fetches event and active playlist when both identifiers are present", async () => {
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventDataSync({
				eventSlug: "event-slug",
				activePlaylistId: "playlist-1",
				fetchEventBySlug,
				fetchPlaylistById,
			});
		});

		await waitFor(() => {
			expect(fetchEventBySlug).toHaveBeenCalledWith("event-slug");
			expect(fetchPlaylistById).toHaveBeenCalledWith("playlist-1");
		});
	});

	it("does not fetch when slug and playlist id are missing", async () => {
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const fetchPlaylistById = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventDataSync({
				eventSlug: undefined,
				activePlaylistId: undefined,
				fetchEventBySlug,
				fetchPlaylistById,
			});
		});

		await waitFor(() => {
			expect(fetchEventBySlug).not.toHaveBeenCalled();
			expect(fetchPlaylistById).not.toHaveBeenCalled();
		});
	});
});
