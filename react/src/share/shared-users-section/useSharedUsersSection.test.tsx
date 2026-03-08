import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { appStore } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { SharedItem } from "../slice/share-types";
import useSharedUsersSection from "./useSharedUsersSection";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");

const CURRENT_USER_ID = "user-123";
const ITEM_TYPE = "song";
const ITEM_ID = "song-456";
const FIRST_INDEX = 0;
const ONE_MATCHING_SHARE = 1;
const TWO_MATCHING_SHARES = 2;

const MATCHING_SHARE: SharedItem = {
	share_id: "share-1",
	sender_user_id: CURRENT_USER_ID,
	recipient_user_id: "recipient-1",
	shared_item_type: ITEM_TYPE,
	shared_item_id: ITEM_ID,
	shared_item_name: "Test Song",
	status: "pending",
	message: undefined,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	sender_username: "sender1",
};

const OTHER_ITEM_SHARE: SharedItem = {
	...MATCHING_SHARE,
	share_id: "share-2",
	shared_item_id: "other-song",
};

const OTHER_TYPE_SHARE: SharedItem = {
	...MATCHING_SHARE,
	share_id: "share-3",
	shared_item_type: "playlist",
	shared_item_id: ITEM_ID,
};

function installStore(opts: {
	sentShares?: Record<string, SharedItem>;
	isSharesLoading?: boolean;
}): void {
	const sentShares = opts.sentShares ?? {};
	const isSharesLoading = opts.isSharesLoading ?? false;
	const mockState = forceCast({
		sentShares,
		isSharesLoading,
	});

	function impl(selector: unknown): unknown {
		if (typeof selector === "function") {
			return forceCast<(state: typeof mockState) => unknown>(selector)(mockState);
		}
		return mockState;
	}

	vi.mocked(appStore).mockImplementation(impl);
}

/**
 * Harness for useSharedUsersSection.
 *
 * Documents how the hook integrates into real UI:
 * - currentUserId for permission checks
 * - itemShares filtered by item type and id
 * - isSharesLoading for loading state
 */
function Harness(): ReactElement {
	const { currentUserId, itemShares, isSharesLoading } = useSharedUsersSection(ITEM_TYPE, ITEM_ID);

	return (
		<div data-testid="harness-root">
			<div data-testid="current-user-id">{String(currentUserId ?? "")}</div>
			<div data-testid="item-share-count">{itemShares.length}</div>
			<div data-testid="is-shares-loading">{String(isSharesLoading)}</div>
		</div>
	);
}

describe("useSharedUsersSection — Harness", () => {
	it("mounts the hook and exposes state", () => {
		cleanup();
		vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
		installStore({});

		const { getByTestId } = render(<Harness />);

		expect(getByTestId("harness-root")).toBeTruthy();
		expect(getByTestId("current-user-id").textContent).toBe(CURRENT_USER_ID);
		expect(getByTestId("item-share-count").textContent).toBe("0");
		expect(getByTestId("is-shares-loading").textContent).toBe("false");
	});
});

describe("useSharedUsersSection — renderHook", () => {
	it("returns currentUserId from useCurrentUserId", () => {
		vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
		installStore({});

		const { result } = renderHook(() => useSharedUsersSection(ITEM_TYPE, ITEM_ID));

		expect(result.current.currentUserId).toBe(CURRENT_USER_ID);
	});

	it("returns undefined currentUserId when not signed in", () => {
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		installStore({});

		const { result } = renderHook(() => useSharedUsersSection(ITEM_TYPE, ITEM_ID));

		expect(result.current.currentUserId).toBeUndefined();
	});

	it("returns isSharesLoading from appStore", () => {
		vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
		installStore({ isSharesLoading: true });

		const { result } = renderHook(() => useSharedUsersSection(ITEM_TYPE, ITEM_ID));

		expect(result.current.isSharesLoading).toBe(true);
	});

	it("filters itemShares by itemType and itemId", () => {
		vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
		installStore({
			sentShares: {
				[MATCHING_SHARE.share_id]: MATCHING_SHARE,
				[OTHER_ITEM_SHARE.share_id]: OTHER_ITEM_SHARE,
				[OTHER_TYPE_SHARE.share_id]: OTHER_TYPE_SHARE,
			},
		});

		const { result } = renderHook(() => useSharedUsersSection(ITEM_TYPE, ITEM_ID));

		expect(result.current.itemShares).toHaveLength(ONE_MATCHING_SHARE);
		expect(result.current.itemShares[FIRST_INDEX]).toStrictEqual(MATCHING_SHARE);
	});

	it("returns empty itemShares when no shares match", () => {
		vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
		installStore({
			sentShares: {
				[OTHER_ITEM_SHARE.share_id]: OTHER_ITEM_SHARE,
				[OTHER_TYPE_SHARE.share_id]: OTHER_TYPE_SHARE,
			},
		});

		const { result } = renderHook(() => useSharedUsersSection(ITEM_TYPE, ITEM_ID));

		expect(result.current.itemShares).toStrictEqual([]);
	});

	it("returns multiple matching shares for same item", () => {
		const share2 = { ...MATCHING_SHARE, share_id: "share-2" };
		vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
		installStore({
			sentShares: {
				[MATCHING_SHARE.share_id]: MATCHING_SHARE,
				[share2.share_id]: share2,
			},
		});

		const { result } = renderHook(() => useSharedUsersSection(ITEM_TYPE, ITEM_ID));

		expect(result.current.itemShares).toHaveLength(TWO_MATCHING_SHARES);
	});
});
