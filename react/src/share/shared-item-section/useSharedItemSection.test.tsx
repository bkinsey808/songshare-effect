import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { SharedItem } from "../slice/share-types";
import useSharedItemSection from "./useSharedItemSection";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");

const CURRENT_USER_ID = "user-1";
const SHARE_ID_1 = "share-1";
const SHARE_ID_2 = "share-2";

const EMPTY_COUNT = 0;
const FIRST_INDEX = 0;
const ONE_PENDING_SHARE = 1;
const TWO_SHARES = 2;

const PENDING_SHARE: SharedItem = {
	share_id: SHARE_ID_1,
	sender_user_id: "sender-1",
	recipient_user_id: CURRENT_USER_ID,
	shared_item_type: "song",
	shared_item_id: "song-1",
	shared_item_name: "Test Song",
	status: "pending",
	message: undefined,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	sender_username: "sender1",
};

const ACCEPTED_SHARE: SharedItem = {
	...PENDING_SHARE,
	share_id: SHARE_ID_2,
	shared_item_name: "Accepted Song",
	status: "accepted",
};

function installStore(opts: {
	receivedShares?: Record<string, SharedItem>;
	sentShares?: Record<string, SharedItem>;
	shareError?: string;
	loadingShareId?: string | null;
	fetchShares?: (req: { view: "received" | "sent"; status?: string }) => Effect.Effect<void, Error>;
	updateShareStatus?: (req: {
		share_id: string;
		status: "accepted" | "rejected";
	}) => Effect.Effect<void, Error>;
	getReceivedSharesByStatus?: (status: string) => SharedItem[];
	getSentSharesByStatus?: (status: string) => SharedItem[];
	subscribeToReceivedShares?: (userId: string) => Effect.Effect<() => void, Error>;
	subscribeToSentShares?: (userId: string) => Effect.Effect<() => void, Error>;
}): void {
	const fetchShares = opts.fetchShares ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const updateShareStatus =
		opts.updateShareStatus ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const subscribeToReceivedShares =
		opts.subscribeToReceivedShares ?? vi.fn().mockReturnValue(Effect.succeed(() => undefined));
	const subscribeToSentShares =
		opts.subscribeToSentShares ?? vi.fn().mockReturnValue(Effect.succeed(() => undefined));

	const getReceivedSharesByStatus =
		opts.getReceivedSharesByStatus ??
		((status: string): SharedItem[] =>
			Object.values(opts.receivedShares ?? {}).filter((sh) => sh.status === status));
	const getSentSharesByStatus =
		opts.getSentSharesByStatus ??
		((status: string): SharedItem[] =>
			Object.values(opts.sentShares ?? {}).filter((sh) => sh.status === status));

	const mockState = forceCast({
		receivedShares: opts.receivedShares ?? {},
		sentShares: opts.sentShares ?? {},
		shareError: opts.shareError,
		loadingShareId: opts.loadingShareId,
		fetchShares,
		updateShareStatus,
		getReceivedSharesByStatus,
		getSentSharesByStatus,
		subscribeToReceivedShares,
		subscribeToSentShares,
	});

	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		if (typeof selector === "function") {
			return forceCast<(state: typeof mockState) => unknown>(selector)(mockState);
		}
		return mockState;
	});
}

/**
 * Harness for useSharedItemSection.
 *
 * Shows how useSharedItemSection integrates into real UI:
 * - Tab buttons for received/sent views
 * - Status filter (all, pending, accepted, rejected)
 * - filtered shares list
 * - Accept/Reject handlers for pending received shares
 * - Error and loading states
 */
function Harness(): ReactElement {
	const {
		currentUserId,
		activeTab,
		setActiveTab,
		statusFilter,
		setStatusFilter,
		isLoading,
		filteredShares,
		shareError,
		loadingShareId,
		handleAcceptShare,
		handleRejectShare,
	} = useSharedItemSection();

	return (
		<div data-testid="harness-root">
			<div data-testid="current-user-id">{String(currentUserId ?? "")}</div>
			<div data-testid="active-tab">{activeTab}</div>
			<div data-testid="status-filter">{statusFilter}</div>
			<div data-testid="is-loading">{String(isLoading)}</div>
			<div data-testid="share-count">{filteredShares.length}</div>
			{shareError !== null && shareError !== undefined && (
				<div data-testid="share-error">{shareError}</div>
			)}
			{loadingShareId !== null && loadingShareId !== undefined && (
				<div data-testid="loading-share-id">{loadingShareId}</div>
			)}
			<button
				type="button"
				data-testid="tab-received"
				onClick={() => {
					setActiveTab("received");
				}}
			>
				Received
			</button>
			<button
				type="button"
				data-testid="tab-sent"
				onClick={() => {
					setActiveTab("sent");
				}}
			>
				Sent
			</button>
			<button
				type="button"
				data-testid="filter-all"
				onClick={() => {
					setStatusFilter("all");
				}}
			>
				All
			</button>
			<button
				type="button"
				data-testid="filter-pending"
				onClick={() => {
					setStatusFilter("pending");
				}}
			>
				Pending
			</button>
			<ul data-testid="shares-list">
				{filteredShares.map((share) => (
					<li key={share.share_id} data-testid={`share-${share.share_id}`}>
						<span data-testid={`share-name-${share.share_id}`}>{share.shared_item_name}</span>
						{activeTab === "received" && share.status === "pending" && (
							<>
								<button
									type="button"
									data-testid={`accept-${share.share_id}`}
									onClick={() => {
										void handleAcceptShare(share.share_id);
									}}
								>
									Accept
								</button>
								<button
									type="button"
									data-testid={`reject-${share.share_id}`}
									onClick={() => {
										void handleRejectShare(share.share_id);
									}}
								>
									Reject
								</button>
							</>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}

describe("useSharedItemSection", () => {
	describe("harness (DOM) behavior", () => {
		it("shows received tab and pending filter by default when signed in", () => {
			cleanup();
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: { [SHARE_ID_1]: PENDING_SHARE },
				sentShares: {},
			});

			const rendered = render(<Harness />);

			expect(within(rendered.container).getByTestId("active-tab").textContent).toBe("received");
			expect(within(rendered.container).getByTestId("status-filter").textContent).toBe("pending");
			expect(within(rendered.container).getByTestId("share-count").textContent).toBe(
				String(ONE_PENDING_SHARE),
			);
		});

		it("switches tab when tab button is clicked", () => {
			cleanup();
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: { [SHARE_ID_1]: PENDING_SHARE },
				sentShares: { [SHARE_ID_2]: ACCEPTED_SHARE },
			});

			const rendered = render(<Harness />);

			fireEvent.click(within(rendered.container).getByTestId("tab-sent"));

			expect(within(rendered.container).getByTestId("active-tab").textContent).toBe("sent");
			expect(within(rendered.container).getByTestId("share-count").textContent).toBe(
				String(EMPTY_COUNT),
			);
		});

		it("updates status filter when filter button is clicked", () => {
			cleanup();
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: {
					[SHARE_ID_1]: PENDING_SHARE,
					[SHARE_ID_2]: ACCEPTED_SHARE,
				},
				sentShares: {},
			});

			const rendered = render(<Harness />);

			fireEvent.click(within(rendered.container).getByTestId("filter-all"));

			expect(within(rendered.container).getByTestId("status-filter").textContent).toBe("all");
			expect(within(rendered.container).getByTestId("share-count").textContent).toBe(
				String(TWO_SHARES),
			);
		});

		it("calls updateShareStatus when Accept is clicked", async () => {
			cleanup();
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const updateShareStatus = vi.fn().mockReturnValue(Effect.succeed(undefined));
			installStore({
				receivedShares: { [SHARE_ID_1]: PENDING_SHARE },
				sentShares: {},
				updateShareStatus,
			});

			const rendered = render(<Harness />);

			fireEvent.click(within(rendered.container).getByTestId(`accept-${SHARE_ID_1}`));

			await waitFor(() => {
				expect(updateShareStatus).toHaveBeenCalledWith(
					expect.objectContaining({
						share_id: SHARE_ID_1,
						status: "accepted",
					}),
				);
			});
		});

		it("calls updateShareStatus when Reject is clicked", async () => {
			cleanup();
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const updateShareStatus = vi.fn().mockReturnValue(Effect.succeed(undefined));
			installStore({
				receivedShares: { [SHARE_ID_1]: PENDING_SHARE },
				sentShares: {},
				updateShareStatus,
			});

			const rendered = render(<Harness />);

			fireEvent.click(within(rendered.container).getByTestId(`reject-${SHARE_ID_1}`));

			await waitFor(() => {
				expect(updateShareStatus).toHaveBeenCalledWith(
					expect.objectContaining({
						share_id: SHARE_ID_1,
						status: "rejected",
					}),
				);
			});
		});

		it("shows shareError when present", () => {
			cleanup();
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const errorMsg = "Fetch failed";
			installStore({
				receivedShares: {},
				sentShares: {},
				shareError: errorMsg,
			});

			const rendered = render(<Harness />);

			expect(within(rendered.container).getByTestId("share-error").textContent).toBe(errorMsg);
		});
	});

	describe("renderHook behavior", () => {
		it("returns currentUserId from useCurrentUserId", () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({ receivedShares: {}, sentShares: {} });

			const { result } = renderHook(() => useSharedItemSection());

			expect(result.current.currentUserId).toBe(CURRENT_USER_ID);
		});

		it("returns initial activeTab received and statusFilter pending", () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({ receivedShares: {}, sentShares: {} });

			const { result } = renderHook(() => useSharedItemSection());

			expect(result.current.activeTab).toBe("received");
			expect(result.current.statusFilter).toBe("pending");
		});

		it("setActiveTab updates activeTab", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({ receivedShares: {}, sentShares: {} });

			const { result } = renderHook(() => useSharedItemSection());

			result.current.setActiveTab("sent");

			await waitFor(() => {
				expect(result.current.activeTab).toBe("sent");
			});
		});

		it("setStatusFilter updates statusFilter", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({ receivedShares: {}, sentShares: {} });

			const { result } = renderHook(() => useSharedItemSection());

			result.current.setStatusFilter("all");

			await waitFor(() => {
				expect(result.current.statusFilter).toBe("all");
			});
		});

		it("filteredShares returns received shares filtered by status when activeTab is received", () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: {
					[SHARE_ID_1]: PENDING_SHARE,
					[SHARE_ID_2]: ACCEPTED_SHARE,
				},
				sentShares: {},
			});

			const { result } = renderHook(() => useSharedItemSection());

			expect(result.current.filteredShares).toHaveLength(ONE_PENDING_SHARE);
			const firstShare = result.current.filteredShares.at(FIRST_INDEX);
			expect(firstShare?.share_id).toBe(SHARE_ID_1);
			expect(firstShare?.status).toBe("pending");
		});

		it("filteredShares returns all received shares when statusFilter is all", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: {
					[SHARE_ID_1]: PENDING_SHARE,
					[SHARE_ID_2]: ACCEPTED_SHARE,
				},
				sentShares: {},
			});

			const { result } = renderHook(() => useSharedItemSection());

			result.current.setStatusFilter("all");

			await waitFor(() => {
				expect(result.current.filteredShares).toHaveLength(TWO_SHARES);
			});
		});

		it("filteredShares returns sent shares when activeTab is sent", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: {},
				sentShares: { [SHARE_ID_1]: PENDING_SHARE },
			});

			const { result } = renderHook(() => useSharedItemSection());

			result.current.setActiveTab("sent");

			await waitFor(() => {
				expect(result.current.filteredShares).toHaveLength(ONE_PENDING_SHARE);
				const firstShare = result.current.filteredShares.at(FIRST_INDEX);
				expect(firstShare?.share_id).toBe(SHARE_ID_1);
			});
		});

		it("passes shareError and loadingShareId from store", () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			installStore({
				receivedShares: {},
				sentShares: {},
				shareError: "Network error",
				loadingShareId: SHARE_ID_1,
			});

			const { result } = renderHook(() => useSharedItemSection());

			expect(result.current.shareError).toBe("Network error");
			expect(result.current.loadingShareId).toBe(SHARE_ID_1);
		});

		it("handleAcceptShare calls updateShareStatus with accepted", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const updateShareStatus = vi.fn().mockReturnValue(Effect.succeed(undefined));
			installStore({
				receivedShares: { [SHARE_ID_1]: PENDING_SHARE },
				sentShares: {},
				updateShareStatus,
			});

			const { result } = renderHook(() => useSharedItemSection());

			await result.current.handleAcceptShare(SHARE_ID_1);

			expect(updateShareStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					share_id: SHARE_ID_1,
					status: "accepted",
				}),
			);
		});

		it("handleRejectShare calls updateShareStatus with rejected", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const updateShareStatus = vi.fn().mockReturnValue(Effect.succeed(undefined));
			installStore({
				receivedShares: { [SHARE_ID_1]: PENDING_SHARE },
				sentShares: {},
				updateShareStatus,
			});

			const { result } = renderHook(() => useSharedItemSection());

			await result.current.handleRejectShare(SHARE_ID_1);

			expect(updateShareStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					share_id: SHARE_ID_1,
					status: "rejected",
				}),
			);
		});

		it("calls fetchShares when currentUserId is defined", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const fetchShares = vi.fn().mockReturnValue(Effect.succeed(undefined));
			installStore({
				receivedShares: {},
				sentShares: {},
				fetchShares,
			});

			renderHook(() => useSharedItemSection());

			await waitFor(() => {
				expect(fetchShares).toHaveBeenCalledWith(
					expect.objectContaining({
						view: "received",
						status: "pending",
					}),
				);
			});
		});

		it("does not call fetchShares when currentUserId is undefined", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(undefined);
			const fetchShares = vi.fn();
			installStore({
				receivedShares: {},
				sentShares: {},
				fetchShares,
			});

			renderHook(() => useSharedItemSection());

			await waitFor(() => {
				expect(fetchShares).not.toHaveBeenCalled();
			});
		});

		it("calls subscribeToReceivedShares and subscribeToSentShares when currentUserId is defined", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const subscribeToReceivedShares = vi.fn().mockReturnValue(Effect.succeed(() => undefined));
			const subscribeToSentShares = vi.fn().mockReturnValue(Effect.succeed(() => undefined));
			installStore({
				receivedShares: {},
				sentShares: {},
				subscribeToReceivedShares,
				subscribeToSentShares,
			});

			renderHook(() => useSharedItemSection());

			await waitFor(() => {
				expect(subscribeToReceivedShares).toHaveBeenCalledWith(CURRENT_USER_ID);
				expect(subscribeToSentShares).toHaveBeenCalledWith(CURRENT_USER_ID);
			});
		});

		it("does not call subscribe functions when currentUserId is undefined", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(undefined);
			const subscribeToReceivedShares = vi.fn();
			const subscribeToSentShares = vi.fn();
			installStore({
				receivedShares: {},
				sentShares: {},
				subscribeToReceivedShares,
				subscribeToSentShares,
			});

			renderHook(() => useSharedItemSection());

			await waitFor(() => {
				expect(subscribeToReceivedShares).not.toHaveBeenCalled();
				expect(subscribeToSentShares).not.toHaveBeenCalled();
			});
		});

		it("calls cleanup on unmount when subscriptions were set up", async () => {
			vi.mocked(useCurrentUserId).mockReturnValue(CURRENT_USER_ID);
			const receivedCleanup = vi.fn();
			const sentCleanup = vi.fn();
			installStore({
				receivedShares: {},
				sentShares: {},
				subscribeToReceivedShares: vi.fn().mockReturnValue(Effect.succeed(receivedCleanup)),
				subscribeToSentShares: vi.fn().mockReturnValue(Effect.succeed(sentCleanup)),
			});

			const { unmount } = renderHook(() => useSharedItemSection());

			await waitFor(() => {
				expect(receivedCleanup).not.toHaveBeenCalled();
				expect(sentCleanup).not.toHaveBeenCalled();
			});

			unmount();

			expect(receivedCleanup).toHaveBeenCalledWith();
			expect(sentCleanup).toHaveBeenCalledWith();
		});
	});
});
