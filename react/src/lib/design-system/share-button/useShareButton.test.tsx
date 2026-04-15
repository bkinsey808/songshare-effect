import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore, { appStore } from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { ShareCreateRequest, SharedItemType } from "@/react/share/slice/share-types";

import useShareButton from "./useShareButton";

type SentShare = {
	shared_item_type: string;
	shared_item_id: string;
	status: string;
	recipient_user_id: string;
};

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");

const ITEM_TYPE: SharedItemType = "song";
const ITEM_ID = "song-1";
const ITEM_NAME = "Test Song";
const CURRENT_USER_ID = "user-1";
const RECIPIENT_USER_ID = "user-2";
const PENDING_USER_ID = "user-3";
const OTHER_USER_ID = "user-4";
const PENDING_SHARE_ID = "share-1";
const ACCEPTED_SHARE_ID = "share-2";
const OTHER_ITEM_SHARE_ID = "share-3";

const SHARE_REQUEST: ShareCreateRequest = {
	shared_item_type: ITEM_TYPE,
	shared_item_id: ITEM_ID,
	shared_item_name: ITEM_NAME,
	recipient_user_id: RECIPIENT_USER_ID,
};

/**
 * Install mocks for `useShareButton` tests.
 *
 * @param opts - Options to control mocked store and auth state
 * @returns void
 */
function installMocks(opts: {
	currentUserId?: string;
	signedIn?: boolean;
	sentShares?: Record<string, SentShare>;
	createShare?: ReturnType<typeof vi.fn>;
	fetchShares?: ReturnType<typeof vi.fn>;
}): void {
	vi.clearAllMocks();

	const signedIn = opts.signedIn !== false;
	const hasCurrentUserId = Object.hasOwn(opts, "currentUserId");
	const currentUserId = hasCurrentUserId ? opts.currentUserId : CURRENT_USER_ID;
	vi.mocked(useCurrentUserId).mockReturnValue(signedIn ? currentUserId : undefined);

	const createShare = opts.createShare ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const fetchShares = opts.fetchShares ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const sentShares = opts.sentShares ?? {};

	vi.mocked(appStore.getState).mockReturnValue(
		forceCast<ReturnType<typeof appStore.getState>>({
			createShare,
			fetchShares,
			sentShares,
		}),
	);

	// useShareButton now subscribes to sentShares reactively via useAppStore.
	vi.mocked(useAppStore).mockImplementation(
		forceCast<typeof useAppStore>(
			(selector: (state: { sentShares: Record<string, SentShare> }) => unknown) =>
				selector({ sentShares }),
		),
	);
}

/**
 * Harness for useShareButton (Documentation by Harness).
 *
 * Demonstrates the hook API in a UI context:
 * - Exposes selection and loading state for rendering
 * - Wires a share button to the selection handler
 * - Shows the excludeUserIds list passed to the user search input
 */
/**
 * Harness for useShareButton (Documentation by Harness).
 *
 * Demonstrates the hook API in a UI context:
 * - Exposes selection and loading state for rendering
 * - Wires a share button to the selection handler
 * - Shows the excludeUserIds list passed to the user search input
 *
 * @param onShareSuccess - Optional callback invoked after a successful share
 * @returns A simple UI harness element for testing the hook
 */
function Harness({ onShareSuccess }: { onShareSuccess?: () => void }): ReactElement {
	const { selectedUserId, isSharing, isPending, excludeUserIds, handleUserSelect } = useShareButton(
		{
			itemType: ITEM_TYPE,
			itemId: ITEM_ID,
			itemName: ITEM_NAME,
			...(onShareSuccess !== undefined && { onShareSuccess }),
		},
	);

	return (
		<div data-testid="harness-root">
			<div data-testid="selected-user-id">{String(selectedUserId ?? "")}</div>
			<div data-testid="is-sharing">{String(isSharing)}</div>
			<div data-testid="is-pending">{String(isPending)}</div>
			<div data-testid="exclude-user-ids">{JSON.stringify(excludeUserIds)}</div>
			<button
				type="button"
				data-testid="select-user"
				onClick={() => {
					handleUserSelect(RECIPIENT_USER_ID);
				}}
			>
				select
			</button>
		</div>
	);
}

describe("useShareButton — Harness", () => {
	it("exposes the current user in excludeUserIds", async () => {
		cleanup();
		installMocks({});

		const rendered = render(<Harness />);
		const harness = within(rendered.container);

		await waitFor(() => {
			expect(harness.getByTestId("exclude-user-ids").textContent).toBe(
				JSON.stringify([CURRENT_USER_ID]),
			);
		});
	});

	it("updates selectedUserId when the user selects a recipient", async () => {
		cleanup();
		installMocks({});

		const rendered = render(<Harness />);
		const harness = within(rendered.container);

		fireEvent.click(harness.getByTestId("select-user"));

		await waitFor(() => {
			expect(harness.getByTestId("selected-user-id").textContent).toBe(RECIPIENT_USER_ID);
		});
	});
});

describe("useShareButton — renderHook", () => {
	it("excludes only pending recipients for the current item", () => {
		installMocks({
			sentShares: {
				[PENDING_SHARE_ID]: {
					shared_item_type: ITEM_TYPE,
					shared_item_id: ITEM_ID,
					status: "pending",
					recipient_user_id: PENDING_USER_ID,
				},
				[ACCEPTED_SHARE_ID]: {
					shared_item_type: ITEM_TYPE,
					shared_item_id: ITEM_ID,
					status: "accepted",
					recipient_user_id: OTHER_USER_ID,
				},
				[OTHER_ITEM_SHARE_ID]: {
					shared_item_type: ITEM_TYPE,
					shared_item_id: "song-2",
					status: "pending",
					recipient_user_id: OTHER_USER_ID,
				},
			},
		});

		const { result } = renderHook(() =>
			useShareButton({
				itemType: ITEM_TYPE,
				itemId: ITEM_ID,
				itemName: ITEM_NAME,
			}),
		);

		expect(result.current.excludeUserIds).toStrictEqual([CURRENT_USER_ID, PENDING_USER_ID]);
	});

	it("creates a share request for the selected user", async () => {
		const createShare = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installMocks({ createShare });

		const { result } = renderHook(() =>
			useShareButton({
				itemType: ITEM_TYPE,
				itemId: ITEM_ID,
				itemName: ITEM_NAME,
			}),
		);

		result.current.handleUserSelect(RECIPIENT_USER_ID);

		await waitFor(() => {
			expect(createShare).toHaveBeenCalledWith(SHARE_REQUEST);
		});
	});

	it("fetches sent shares after a successful share", async () => {
		const fetchShares = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installMocks({ fetchShares });

		const { result } = renderHook(() =>
			useShareButton({
				itemType: ITEM_TYPE,
				itemId: ITEM_ID,
				itemName: ITEM_NAME,
			}),
		);

		result.current.handleUserSelect(RECIPIENT_USER_ID);

		await waitFor(() => {
			expect(fetchShares).toHaveBeenCalledWith({ view: "sent" });
		});
	});

	it("calls onShareSuccess after the share completes", async () => {
		const onShareSuccess = vi.fn();
		installMocks({});

		const { result } = renderHook(() =>
			useShareButton({
				itemType: ITEM_TYPE,
				itemId: ITEM_ID,
				itemName: ITEM_NAME,
				onShareSuccess,
			}),
		);

		result.current.handleUserSelect(RECIPIENT_USER_ID);

		await waitFor(() => {
			expect(onShareSuccess).toHaveBeenCalledWith();
		});
	});

	it("warns and skips sharing when currentUserId is missing", () => {
		const createShare = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installMocks({ signedIn: false, createShare });

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());

		const { result } = renderHook(() =>
			useShareButton({
				itemType: ITEM_TYPE,
				itemId: ITEM_ID,
				itemName: ITEM_NAME,
			}),
		);

		result.current.handleUserSelect(RECIPIENT_USER_ID);

		expect(warnSpy).toHaveBeenCalledWith("Cannot share: user not signed in");
		expect(createShare).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
