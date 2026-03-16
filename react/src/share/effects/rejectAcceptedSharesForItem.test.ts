import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiShareRejectByItemPath } from "@/shared/paths";

import rejectAcceptedSharesForItem from "./rejectAcceptedSharesForItem";

vi.mock("@/shared/fetch/postJsonWithResult");

const FIRST_CALL = 1;

describe("rejectAcceptedSharesForItem", () => {
	it("calls postJsonWithResult with correct path and body", async () => {
		vi.mocked(postJsonWithResult).mockResolvedValue({
			success: true,
			rejected_count: 2,
		});

		await Effect.runPromise(rejectAcceptedSharesForItem("song", "song-123"));

		expect(postJsonWithResult).toHaveBeenCalledTimes(FIRST_CALL);
		expect(postJsonWithResult).toHaveBeenCalledWith(apiShareRejectByItemPath, {
			shared_item_type: "song",
			shared_item_id: "song-123",
		});
	});

	it("succeeds even when postJsonWithResult fails (non-fatal)", async () => {
		vi.mocked(postJsonWithResult).mockRejectedValue(new Error("network error"));
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await Effect.runPromise(rejectAcceptedSharesForItem("playlist", "playlist-456"));

		expect(consoleSpy).toHaveBeenCalledWith(
			"[rejectAcceptedSharesForItem] Failed to reject shares for item:",
			"playlist",
			"playlist-456",
			expect.any(Error),
		);
		consoleSpy.mockRestore();
	});
});
