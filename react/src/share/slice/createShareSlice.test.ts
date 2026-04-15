/**
 * Unit tests for createShareSlice.
 * Exercises initial state, method exposure, setters, helpers, optimistic updates,
 * reset registration, and subscription Effects.
 */
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import forceCast from "@/react/lib/test-utils/forceCast";

import createShareEffect from "../create/createShareEffect";
import fetchSharesEffect from "../create/fetchSharesEffect";
import updateShareStatusEffect from "../effects/updateShareStatusEffect";
import subscribeToReceivedShares from "../subscribe/subscribeToReceivedShares";
import subscribeToSentShares from "../subscribe/subscribeToSentShares";
import createShareSlice from "./createShareSlice";
import type { SharedItem, ShareState } from "./share-types";
import type { ShareSlice } from "./ShareSlice.type";

vi.mock("../create/createShareEffect");
vi.mock("../create/fetchSharesEffect");
vi.mock("../effects/updateShareStatusEffect");
vi.mock("../subscribe/subscribeToReceivedShares");
vi.mock("../subscribe/subscribeToSentShares");

/** Expected count for single-item status filter results. */
const PENDING_COUNT = 1;
/** Expected count for single-item accepted status filter results. */
const ACCEPTED_COUNT = 1;
/** Minimum number of reset functions expected after creating a slice. */
const MIN_RESET_REGISTRATION = 0;
/** Array index for first element in status filter results. */
const FIRST_INDEX = 0;

/**
 * Builds a SharedItem fixture for tests.
 *
 * @param overrides - Partial fields to override defaults
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

/**
 * Creates a mock store with mutable state and a ShareSlice wired to it.
 *
 * @param initialState - Optional initial share state (receivedShares, sentShares, etc.)
 * @returns Store with state, set, get, api, and the constructed slice
 */
function makeMockStore(initialState: Partial<ShareState> = {}): {
	state: ShareState;
	set: Set<ShareSlice>;
	get: Get<ShareSlice>;
	api: Api<ShareSlice>;
	slice: ShareSlice;
} {
	let state: ShareState = {
		receivedShares: initialState.receivedShares ?? {},
		sentShares: initialState.sentShares ?? {},
		isSharesLoading: initialState.isSharesLoading ?? false,
		shareError: initialState.shareError,
		loadingShareId: initialState.loadingShareId,
	};

	/**
	 * Mock `set` implementation used by the test store to apply partials or updaters.
	 *
	 * @param patchOrUpdater - Partial state or updater function applied to the mock store.
	 * @returns void
	 */
	function setState(
		patchOrUpdater:
			| Partial<ShareState>
			| ((stateParam: ShareState & ShareSlice) => Partial<ShareState>),
	): void {
		if (typeof patchOrUpdater === "function") {
			const next = (patchOrUpdater as (st: ShareState & ShareSlice) => Partial<ShareState>)({
				...sliceHolder.current,
				...state,
			});
			Object.assign(state, next);
		} else {
			Object.assign(state, patchOrUpdater);
		}
	}

	const sliceHolder: { current: ShareSlice } = {
		current: forceCast<ShareSlice>(undefined),
	};
	/**
	 * Mock `get` function that returns the composed current slice state.
	 *
	 * @returns The current `ShareSlice` state used in tests.
	 */
	function get(): ShareSlice {
		return { ...sliceHolder.current, ...state };
	}

	const api: Api<ShareSlice> = {
		setState(patchOrUpdater) {
			setState(
				patchOrUpdater as
					| Partial<ShareState>
					| ((st: ShareState & ShareSlice) => Partial<ShareState>),
			);
		},
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};

	sliceHolder.current = createShareSlice(setState, get, api);

	return { state, set: setState, get, api, slice: sliceHolder.current };
}

/**
 * Configures vi.mocked return values for share effects and subscription modules.
 *
 * @returns void
 */
function installMocks(): void {
	vi.mocked(createShareEffect).mockReturnValue(Effect.succeed({ shareId: "share-1" }));
	vi.mocked(fetchSharesEffect).mockReturnValue(Effect.succeed(undefined));
	vi.mocked(updateShareStatusEffect).mockReturnValue(Effect.succeed(undefined));
	vi.mocked(subscribeToReceivedShares).mockReturnValue(Effect.succeed(() => undefined));
	vi.mocked(subscribeToSentShares).mockReturnValue(Effect.succeed(() => undefined));
}

describe("createShareSlice", () => {
	it("returns initial state", () => {
		installMocks();
		const store = makeMockStore();
		const { slice } = store;

		expect(slice.receivedShares).toStrictEqual({});
		expect(slice.sentShares).toStrictEqual({});
		expect(slice.isSharesLoading).toBe(false);
		expect(slice.shareError).toBeUndefined();
		expect(slice.loadingShareId).toBeUndefined();
	});

	it("exposes effect and subscription methods", () => {
		installMocks();
		const store = makeMockStore();
		const { slice } = store;

		expect(typeof slice.createShare).toBe("function");
		expect(typeof slice.updateShareStatus).toBe("function");
		expect(typeof slice.fetchShares).toBe("function");
		expect(typeof slice.subscribeToReceivedShares).toBe("function");
		expect(typeof slice.subscribeToSentShares).toBe("function");
	});

	it("exposes helper and setter methods", () => {
		installMocks();
		const store = makeMockStore();
		const { slice } = store;

		expect(typeof slice.isInReceivedShares).toBe("function");
		expect(typeof slice.isInSentShares).toBe("function");
		expect(typeof slice.getReceivedShareIds).toBe("function");
		expect(typeof slice.getSentShareIds).toBe("function");
		expect(typeof slice.setReceivedShares).toBe("function");
		expect(typeof slice.setSentShares).toBe("function");
	});

	it("exposes optimistic update and add/remove methods", () => {
		installMocks();
		const store = makeMockStore();
		const { slice } = store;

		expect(typeof slice.addReceivedShare).toBe("function");
		expect(typeof slice.addSentShare).toBe("function");
		expect(typeof slice.updateShareStatusOptimistically).toBe("function");
		expect(typeof slice.addShareOptimistically).toBe("function");
		expect(typeof slice.removeShareOptimistically).toBe("function");
	});

	it("setReceivedShares and setSentShares update state", () => {
		installMocks();
		const store = makeMockStore();
		const { slice, state } = store;

		const share = makeSharedItem({ share_id: "s1" });
		slice.setReceivedShares({ s1: share });
		expect(state.receivedShares).toStrictEqual({ s1: share });

		slice.setSentShares({ s1: share });
		expect(state.sentShares).toStrictEqual({ s1: share });
	});

	it("setSharesLoading, setShareError, setLoadingShareId update state", () => {
		installMocks();
		const store = makeMockStore();
		const { slice, state } = store;

		slice.setSharesLoading(true);
		expect(state.isSharesLoading).toBe(true);

		slice.setShareError("network error");
		expect(state.shareError).toBe("network error");

		slice.setLoadingShareId("share-123");
		expect(state.loadingShareId).toBe("share-123");
	});

	it("addReceivedShare and addSentShare add shares", () => {
		installMocks();
		const store = makeMockStore();
		const { slice, state } = store;

		const share1 = makeSharedItem({ share_id: "s1" });
		const share2 = makeSharedItem({ share_id: "s2" });

		slice.addReceivedShare(share1);
		expect(state.receivedShares).toHaveProperty("s1", share1);

		slice.addReceivedShare(share2);
		expect(state.receivedShares).toHaveProperty("s2", share2);

		slice.addSentShare(share1);
		expect(state.sentShares).toHaveProperty("s1", share1);
	});

	it("isInReceivedShares and isInSentShares behave correctly", () => {
		installMocks();
		const share = makeSharedItem({ share_id: "s1" });
		const store = makeMockStore({
			receivedShares: { s1: share },
			sentShares: {},
		});
		const { slice } = store;

		expect(slice.isInReceivedShares("s1")).toBe(true);
		expect(slice.isInReceivedShares("missing")).toBe(false);
		expect(slice.isInSentShares("s1")).toBe(false);

		slice.addSentShare(share);
		expect(slice.isInSentShares("s1")).toBe(true);
	});

	it("getReceivedShareIds and getSentShareIds return ids", () => {
		installMocks();
		const share1 = makeSharedItem({ share_id: "s1" });
		const share2 = makeSharedItem({ share_id: "s2" });
		const store = makeMockStore({
			receivedShares: { s1: share1, s2: share2 },
			sentShares: { s1: share1 },
		});
		const { slice } = store;

		expect(slice.getReceivedShareIds()).toStrictEqual(["s1", "s2"]);
		expect(slice.getSentShareIds()).toStrictEqual(["s1"]);
	});

	it("getReceivedSharesByStatus and getSentSharesByStatus filter by status", () => {
		installMocks();
		const pendingShare = makeSharedItem({ share_id: "pending-1", status: "pending" });
		const acceptedShare = makeSharedItem({
			share_id: "accepted-1",
			status: "accepted",
		});
		const store = makeMockStore({
			receivedShares: { "pending-1": pendingShare, "accepted-1": acceptedShare },
			sentShares: { "pending-1": pendingShare },
		});
		const { slice } = store;

		expect(slice.getReceivedSharesByStatus("pending")).toHaveLength(PENDING_COUNT);
		expect(slice.getReceivedSharesByStatus("pending")[FIRST_INDEX]).toStrictEqual(pendingShare);
		expect(slice.getReceivedSharesByStatus("accepted")).toHaveLength(ACCEPTED_COUNT);
		expect(slice.getReceivedSharesByStatus("accepted")[FIRST_INDEX]).toStrictEqual(acceptedShare);
		expect(slice.getSentSharesByStatus("pending")).toHaveLength(PENDING_COUNT);
	});

	it("updateShareStatusOptimistically updates share status in both maps", () => {
		installMocks();
		const share = makeSharedItem({ share_id: "s1", status: "pending" });
		const store = makeMockStore({
			receivedShares: { s1: share },
			sentShares: { s1: share },
		});
		const { slice, state } = store;

		slice.updateShareStatusOptimistically("s1", "accepted");

		expect(state.receivedShares["s1"]?.status).toBe("accepted");
		expect(state.sentShares["s1"]?.status).toBe("accepted");
	});

	it("addShareOptimistically adds to receivedShares", () => {
		installMocks();
		const store = makeMockStore();
		const { slice, state } = store;
		const share = makeSharedItem({ share_id: "s1" });

		slice.addShareOptimistically(share);

		expect(state.receivedShares).toHaveProperty("s1", share);
	});

	it("removeShareOptimistically removes from both maps", () => {
		installMocks();
		const share = makeSharedItem({ share_id: "s1" });
		const store = makeMockStore({
			receivedShares: { s1: share },
			sentShares: { s1: share },
		});
		const { slice, state } = store;

		slice.removeShareOptimistically("s1");

		expect(state.receivedShares).not.toHaveProperty("s1");
		expect(state.sentShares).not.toHaveProperty("s1");
	});

	it("removeReceivedShare and removeSentShare remove from respective maps", () => {
		installMocks();
		const share = makeSharedItem({ share_id: "s1" });
		const store = makeMockStore({
			receivedShares: { s1: share },
			sentShares: { s1: share },
		});
		const { slice, state } = store;

		slice.removeReceivedShare("s1");
		expect(state.receivedShares).not.toHaveProperty("s1");
		expect(state.sentShares).toHaveProperty("s1");

		slice.removeSentShare("s1");
		expect(state.sentShares).not.toHaveProperty("s1");
	});

	it("subscribeToReceivedShares and subscribeToSentShares return successful effects", async () => {
		installMocks();
		const store = makeMockStore();
		const { slice } = store;

		const unsubReceived = await Effect.runPromise(slice.subscribeToReceivedShares("user-1"));
		expect(typeof unsubReceived).toBe("function");

		const unsubSent = await Effect.runPromise(slice.subscribeToSentShares("user-1"));
		expect(typeof unsubSent).toBe("function");
	});

	it("registers a reset function that resets to initial state", () => {
		installMocks();
		sliceResetFns.clear();

		const share = makeSharedItem({ share_id: "s1" });
		const store = makeMockStore({
			receivedShares: { s1: share },
			sentShares: { s1: share },
			isSharesLoading: true,
			shareError: "err",
		});

		createShareSlice(store.set, store.get, store.api);

		expect(sliceResetFns.size).toBeGreaterThan(MIN_RESET_REGISTRATION);

		for (const fn of sliceResetFns) {
			fn();
		}

		expect(store.state.receivedShares).toStrictEqual({});
		expect(store.state.sentShares).toStrictEqual({});
		expect(store.state.isSharesLoading).toBe(false);
		expect(store.state.shareError).toBeUndefined();

		sliceResetFns.clear();
	});
});
