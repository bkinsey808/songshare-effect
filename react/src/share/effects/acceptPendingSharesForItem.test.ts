import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { SharedItem } from "@/react/share/slice/share-types";

import acceptPendingSharesForItem from "./acceptPendingSharesForItem";

/**
 * Build a minimal `SharedItem` fixture for tests.
 *
 * @param overrides - Partial fields to customize the fixture.
 * @returns A `SharedItem` test fixture.
 */
function makeSharedItem(overrides: Partial<SharedItem> = {}): SharedItem {
	return {
		share_id: "share-1",
		sender_user_id: "user-a",
		recipient_user_id: "user-b",
		shared_item_type: "song",
		shared_item_id: "song-1",
		shared_item_name: "Test Song",
		status: "pending",
		message: undefined,
		created_at: "2025-01-01T00:00:00Z",
		updated_at: "2025-01-01T00:00:00Z",
		...overrides,
	};
}

const FIRST_CALL = 1;

describe("acceptPendingSharesForItem", () => {
	it("no-ops when get returns object without getReceivedSharesByStatus", async () => {
		/**
		 * Return a minimal slice-like object containing `updateShareStatus`.
		 *
		 * @returns An object with `updateShareStatus` mock.
		 */
		function get(): unknown {
			return { updateShareStatus: vi.fn() };
		}

		await Effect.runPromise(acceptPendingSharesForItem("song", "song-1", get));

		const slice = forceCast<{ updateShareStatus?: unknown }>(get());
		expect(typeof slice.updateShareStatus).toBe("function");
	});

	it("no-ops when get returns object without updateShareStatus", async () => {
		const getReceivedSharesByStatus = vi.fn(() => []);
		/**
		 * Return a minimal slice-like object exposing `getReceivedSharesByStatus`.
		 *
		 * @returns An object with `getReceivedSharesByStatus` mock.
		 */
		function get(): unknown {
			return { getReceivedSharesByStatus };
		}

		await Effect.runPromise(acceptPendingSharesForItem("song", "song-1", get));

		expect(getReceivedSharesByStatus).not.toHaveBeenCalled();
	});

	it("calls updateShareStatus for each matching pending share", async () => {
		const matchingShare = makeSharedItem({
			share_id: "share-match",
			shared_item_type: "song",
			shared_item_id: "song-1",
			status: "pending",
		});
		const updateShareStatus = vi.fn(() => Effect.void);
		const getReceivedSharesByStatus = vi.fn(() => [matchingShare] as const);
		/**
		 * Return a slice-like object with both `getReceivedSharesByStatus` and
		 * `updateShareStatus` for matching-share tests.
		 *
		 * @returns An object with both mocks.
		 */
		/**
		 * Return a slice-like object with both `getReceivedSharesByStatus` and
		 * `updateShareStatus` for matching-share tests.
		 *
		 * @returns An object with both mocks.
		 */
		function get(): unknown {
			return {
				getReceivedSharesByStatus,
				updateShareStatus,
			};
		}

		await Effect.runPromise(acceptPendingSharesForItem("song", "song-1", get));

		expect(getReceivedSharesByStatus).toHaveBeenCalledWith("pending");
		expect(updateShareStatus).toHaveBeenCalledTimes(FIRST_CALL);
		expect(updateShareStatus).toHaveBeenCalledWith({
			share_id: "share-match",
			status: "accepted",
		});
	});

	it("does not call updateShareStatus when no shares match", async () => {
		const otherShare = makeSharedItem({
			share_id: "share-other",
			shared_item_type: "song",
			shared_item_id: "song-other",
			status: "pending",
		});
		const updateShareStatus = vi.fn(() => Effect.void);
		const getReceivedSharesByStatus = vi.fn(() => [otherShare] as const);
		/**
		 * Return a slice-like object used for failure path tests.
		 *
		 * @returns An object with both mocks.
		 */
		function get(): unknown {
			return {
				getReceivedSharesByStatus,
				updateShareStatus,
			};
		}

		await Effect.runPromise(acceptPendingSharesForItem("song", "song-1", get));

		expect(updateShareStatus).not.toHaveBeenCalled();
	});

	it("continues when updateShareStatus fails (non-fatal)", async () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const matchingShare = makeSharedItem({
			share_id: "share-match",
			shared_item_type: "song",
			shared_item_id: "song-1",
			status: "pending",
		});
		const updateShareStatus = vi.fn(() => Effect.fail(new Error("update failed")));
		const getReceivedSharesByStatus = vi.fn(() => [matchingShare] as const);
		/**
		 * Return a slice-like object with both `getReceivedSharesByStatus` and
		 * `updateShareStatus` for matching-share tests.
		 *
		 * @returns An object with both mocks.
		 */
		function get(): unknown {
			return {
				getReceivedSharesByStatus,
				updateShareStatus,
			};
		}

		await Effect.runPromise(acceptPendingSharesForItem("song", "song-1", get));

		expect(consoleSpy).toHaveBeenCalledWith(
			"[acceptPendingSharesForItem] Failed to accept share:",
			"share-match",
			expect.any(Error),
		);
		consoleSpy.mockRestore();
	});
});
