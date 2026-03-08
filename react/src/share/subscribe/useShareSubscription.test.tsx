import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import forceCast from "@/react/lib/test-utils/forceCast";

import useShareSubscription from "./useShareSubscription";

const mockGetStateReturn = vi.hoisted<{ current: Record<string, unknown> }>(() => ({
	current: {} as Record<string, unknown>,
}));

vi.mock("@/react/auth/useCurrentUserId");
// oxlint-disable-next-line jest/no-untyped-mock-factory -- partial mock for getState only
vi.mock("@/react/app-store/useAppStore", () => ({
	__esModule: true,
	default: vi.fn(),
	appStore: {
		getState: (): Record<string, unknown> => mockGetStateReturn.current,
	},
	getTypedState: vi.fn(),
}));

const CURRENT_USER_ID = "user-123";

function installMocks(opts: {
	/** When false, simulates no signed-in user (skips fetch/subscribe) */
	signedIn?: boolean;
	currentUserId?: string | null;
	fetchShares?: ReturnType<typeof vi.fn>;
	subscribeToSentShares?: ReturnType<typeof vi.fn>;
	setSharesLoading?: ReturnType<typeof vi.fn>;
	sentShares?: Record<string, unknown>;
}): void {
	const signedIn = opts.signedIn !== false;
	const userId = opts.currentUserId === undefined ? CURRENT_USER_ID : opts.currentUserId;
	vi.mocked(useCurrentUserId).mockReturnValue(
		signedIn && typeof userId === "string" ? userId : undefined,
	);

	const fetchShares = opts.fetchShares ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const subscribeToSentShares =
		opts.subscribeToSentShares ?? vi.fn().mockReturnValue(Effect.succeed(() => undefined));
	const setSharesLoading = opts.setSharesLoading ?? vi.fn();
	const sentShares = opts.sentShares ?? {};

	mockGetStateReturn.current = {
		fetchShares,
		subscribeToSentShares,
		setSharesLoading,
		sentShares,
		isSharesLoading: false,
	};
}

/**
 * Harness for useShareSubscription (Documentation by Harness).
 *
 * This is a void hook — it fetches sent shares and subscribes to real-time
 * updates when the user is signed in. The Harness mounts the hook and exposes
 * store state (isSharesLoading, sentShares) to document how the hook affects
 * the app store. Call from a page component before any conditional returns.
 */
function Harness(): ReactElement {
	useShareSubscription();
	const state = mockGetStateReturn.current;
	const isSharesLoading = forceCast<boolean>(state["isSharesLoading"]);
	const sentShares = forceCast<Record<string, unknown> | undefined>(state["sentShares"]);
	const sentShareCount = Object.keys(sentShares ?? {}).length;

	return (
		<div data-testid="harness-root">
			<div data-testid="is-shares-loading">{String(isSharesLoading)}</div>
			<div data-testid="sent-share-count">{sentShareCount}</div>
		</div>
	);
}

describe("useShareSubscription — Harness", () => {
	it("mounts the hook and exposes store state", async () => {
		cleanup();
		installMocks({});

		const { getByTestId } = render(<Harness />);

		await waitFor(() => {
			expect(getByTestId("harness-root")).toBeTruthy();
			expect(getByTestId("is-shares-loading").textContent).toBe("false");
			expect(getByTestId("sent-share-count").textContent).toBe("0");
		});
	});
});

describe("useShareSubscription — renderHook", () => {
	it("skips fetch and subscribe when currentUserId is not a string", async () => {
		const fetchShares = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const subscribeToSentShares = vi.fn().mockReturnValue(Effect.succeed(() => undefined));
		installMocks({
			signedIn: false,
			fetchShares,
			subscribeToSentShares,
		});

		renderHook(() => {
			useShareSubscription();
		});

		await waitFor(() => {
			expect(useCurrentUserId).toHaveBeenCalledWith();
		});

		expect(fetchShares).not.toHaveBeenCalled();
		expect(subscribeToSentShares).not.toHaveBeenCalled();
	});

	it("calls fetchShares with view sent when currentUserId is defined", async () => {
		const fetchShares = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installMocks({ fetchShares });

		renderHook(() => {
			useShareSubscription();
		});

		await waitFor(() => {
			expect(fetchShares).toHaveBeenCalledWith({ view: "sent" });
		});
	});

	it("calls subscribeToSentShares with currentUserId when fetch succeeds", async () => {
		const subscribeToSentShares = vi.fn().mockReturnValue(Effect.succeed(() => undefined));
		installMocks({ subscribeToSentShares });

		renderHook(() => {
			useShareSubscription();
		});

		await waitFor(() => {
			expect(subscribeToSentShares).toHaveBeenCalledWith(CURRENT_USER_ID);
		});
	});

	it("calls setSharesLoading and sent cleanup on unmount", async () => {
		const sentCleanup = vi.fn();
		const setSharesLoading = vi.fn();
		const subscribeToSentShares = vi.fn().mockReturnValue(Effect.succeed(sentCleanup));
		installMocks({
			subscribeToSentShares,
			setSharesLoading,
		});

		const { unmount } = renderHook(() => {
			useShareSubscription();
		});

		await waitFor(() => {
			expect(subscribeToSentShares).toHaveBeenCalledWith(CURRENT_USER_ID);
		});

		unmount();

		expect(sentCleanup).toHaveBeenCalledWith();
		expect(setSharesLoading).toHaveBeenCalledWith(false);
	});

	it("calls setSharesLoading(false) on fetch error", async () => {
		const setSharesLoading = vi.fn();
		const fetchShares = vi.fn().mockReturnValue(Effect.fail(new Error("fetch failed")));
		installMocks({ fetchShares, setSharesLoading });

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());

		renderHook(() => {
			useShareSubscription();
		});

		await waitFor(() => {
			expect(setSharesLoading).toHaveBeenCalledWith(false);
		});

		consoleSpy.mockRestore();
	});
});
