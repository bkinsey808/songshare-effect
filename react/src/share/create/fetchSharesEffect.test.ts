import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Get } from "@/react/app-store/app-store-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import extractSharesFromResponse from "@/react/share/create/extractSharesFromResponse";
import type { ShareListRequest, SharedItem } from "@/react/share/slice/share-types";
import type { ShareSlice } from "@/react/share/slice/ShareSlice.type";
import { apiShareListPath } from "@/shared/paths";

import fetchSharesEffect from "./fetchSharesEffect";

vi.mock("@/react/share/create/extractSharesFromResponse");

const FIRST_CALL = 1;
const FIRST_CALL_INDEX = 0;
const FIRST_ARG_INDEX = 0;

/**
 * Normalize a URL or string to an href string.
 *
 * @param value - value that may be a string or URL
 * @returns href string or empty string for non-URL values
 */
function toUrlString(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}
	if (value instanceof URL) {
		return value.href;
	}
	return "";
}

/**
 * Wrap test body with a temporary global fetch mock and ensure cleanup.
 *
 * @param mockImpl - function returning a fetch mock implementation
 * @param testFn - async test body to execute while the mock is installed
 * @returns Promise that resolves after the test body runs and cleanup completes
 */
async function withFetchMock(
	mockImpl: () => ReturnType<typeof vi.fn>,
	testFn: () => Promise<void>,
): Promise<void> {
	vi.resetAllMocks();
	const originalFetch = globalThis.fetch;
	vi.stubGlobal("fetch", mockImpl());
	vi.mocked(extractSharesFromResponse).mockReturnValue([mockShare]);
	try {
		await testFn();
	} finally {
		vi.stubGlobal("fetch", originalFetch);
	}
}

const mockShare: SharedItem = {
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
};

describe("fetchSharesEffect", () => {
	const setSharesLoading = vi.fn();
	const setShareError = vi.fn();
	const setReceivedShares = vi.fn();
	const setSentShares = vi.fn();

	/**
	 * Create a minimal `get` function that returns a ShareSlice-like object
	 * with the mocked setter spies used by the tests.
	 *
	 * @returns Get<ShareSlice> returning the stubbed slice methods
	 */
	function makeGet(): Get<ShareSlice> {
		return () =>
			forceCast<ShareSlice>({
				setSharesLoading,
				setShareError,
				setReceivedShares,
				setSentShares,
			});
	}

	/**
	 * Default fetch mock returning an empty JSON response.
	 *
	 * @returns A vi mock implementation that resolves to an empty JSON response
	 */
	function defaultFetchMock(): ReturnType<typeof vi.fn> {
		return vi.fn().mockResolvedValue(Response.json({}));
	}

	it("calls API with view param and updates received shares when view is received", async () => {
		await withFetchMock(defaultFetchMock, async () => {
			const request: ShareListRequest = { view: "received" };
			const get = makeGet();

			await Effect.runPromise(fetchSharesEffect(request, get));

			expect(globalThis.fetch).toHaveBeenCalledWith(
				`${apiShareListPath}?view=received`,
				expect.objectContaining({
					method: "GET",
					credentials: "include",
				}),
			);
			expect(setReceivedShares).toHaveBeenCalledWith({
				"share-1": mockShare,
			});
			expect(setSentShares).not.toHaveBeenCalled();
		});
	});

	it("updates sent shares when view is sent", async () => {
		await withFetchMock(defaultFetchMock, async () => {
			const request: ShareListRequest = { view: "sent" };
			const get = makeGet();

			await Effect.runPromise(fetchSharesEffect(request, get));

			expect(setSentShares).toHaveBeenCalledWith({
				"share-1": mockShare,
			});
			expect(setReceivedShares).not.toHaveBeenCalled();
		});
	});

	it("includes status and item_type in query when provided", async () => {
		await withFetchMock(defaultFetchMock, async () => {
			const request: ShareListRequest = {
				view: "received",
				status: "accepted",
				item_type: "song",
			};
			const get = makeGet();

			await Effect.runPromise(fetchSharesEffect(request, get));

			const mockFetch = vi.mocked(globalThis.fetch);
			const firstCallArgs = mockFetch.mock.calls[FIRST_CALL_INDEX];
			const callUrl = firstCallArgs?.[FIRST_ARG_INDEX];
			expect(callUrl).toBeDefined();
			const urlStr = toUrlString(callUrl);
			expect(urlStr).toContain("view=received");
			expect(urlStr).toContain("status=accepted");
			expect(urlStr).toContain("item_type=song");
		});
	});

	it("sets and clears loading state on success", async () => {
		await withFetchMock(defaultFetchMock, async () => {
			const request: ShareListRequest = { view: "received" };
			const get = makeGet();

			await Effect.runPromise(fetchSharesEffect(request, get));

			expect(setSharesLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
			expect(setSharesLoading).toHaveBeenLastCalledWith(false);
			expect(setShareError).toHaveBeenCalledWith(undefined);
		});
	});

	it("rejects when fetch fails (loading set to true; Effect failure bypasses finally)", async () => {
		const errorMessage = "network fail";
		/**
		 * Fetch mock that rejects to simulate a network error.
		 *
		 * @returns A vi mock that rejects with an Error
		 */
		function failFetchMock(): ReturnType<typeof vi.fn> {
			return vi.fn().mockRejectedValue(new Error(errorMessage));
		}

		await withFetchMock(failFetchMock, async () => {
			const request: ShareListRequest = { view: "received" };
			const get = makeGet();
			const eff = fetchSharesEffect(request, get);

			await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to fetch shares/);

			expect(setShareError).toHaveBeenCalledWith(undefined);
			expect(setReceivedShares).not.toHaveBeenCalled();
			expect(setSharesLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		});
	});

	it("rejects when HTTP response is not ok (loading set to true; Effect failure bypasses finally)", async () => {
		/**
		 * Fetch mock that resolves to an HTTP 403 response.
		 *
		 * @returns A vi mock resolving to a 403 Response
		 */
		function forbiddenFetchMock(): ReturnType<typeof vi.fn> {
			return vi
				.fn()
				.mockResolvedValue(new Response("Forbidden", { status: 403, statusText: "Forbidden" }));
		}

		await withFetchMock(forbiddenFetchMock, async () => {
			const request: ShareListRequest = { view: "received" };
			const get = makeGet();
			const eff = fetchSharesEffect(request, get);

			await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to fetch shares/);

			expect(setShareError).toHaveBeenCalledWith(undefined);
			expect(setReceivedShares).not.toHaveBeenCalled();
			expect(setSharesLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		});
	});

	it("converts multiple shares to record keyed by share_id", async () => {
		await withFetchMock(defaultFetchMock, async () => {
			const secondShare: SharedItem = {
				...mockShare,
				share_id: "share-2",
			};
			vi.mocked(extractSharesFromResponse).mockReturnValue([mockShare, secondShare]);

			const request: ShareListRequest = { view: "received" };
			const get = makeGet();

			await Effect.runPromise(fetchSharesEffect(request, get));

			expect(setReceivedShares).toHaveBeenCalledWith({
				"share-1": mockShare,
				"share-2": secondShare,
			});
		});
	});
});
