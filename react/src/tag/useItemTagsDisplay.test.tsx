import { act, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";
import fetchItemTagsEffect from "@/react/tag-library/image/fetchItemTagsRequest";

import useItemTagsDisplay from "./useItemTagsDisplay";

vi.mock("@/react/tag-library/image/fetchItemTagsRequest");
vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
vi.mock("@/react/lib/supabase/subscription/status/handleSubscriptionStatus");
vi.mock("@/react/lib/supabase/subscription/status/isSubscriptionStatus");

const ITEM_ID = "item-uuid-123";
const PLAYLIST_ID = "playlist-uuid-456";
const SLUG_A = "rock";
const SLUG_B = "pop";
const AUTH_TOKEN = "test-auth-token";

const MOCK_CLIENT = forceCast<ReturnType<typeof getSupabaseClient>>({});

type OnEventFn = (payload: unknown) => Effect.Effect<void, Error>;

type OnEventCapture = { fn: OnEventFn | undefined };

function setupDefaultMocks(capture?: OnEventCapture): void {
	vi.clearAllMocks();
	vi.mocked(fetchItemTagsEffect).mockReturnValue(Effect.succeed([]));
	vi.mocked(getSupabaseAuthToken).mockResolvedValue(AUTH_TOKEN);
	vi.mocked(getSupabaseClient).mockReturnValue(MOCK_CLIENT);
	if (capture) {
		vi.mocked(createRealtimeSubscription).mockImplementation((config) => {
			capture.fn = config.onEvent as OnEventFn;
			return vi.fn();
		});
	} else {
		vi.mocked(createRealtimeSubscription).mockReturnValue(vi.fn());
	}
}

describe("useItemTagsDisplay", () => {
	it("returns empty array before fetch completes", () => {
		setupDefaultMocks();

		const { result } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		expect(result.current).toStrictEqual([]);
	});

	it("skips fetch and subscription when itemId is undefined", () => {
		setupDefaultMocks();

		const { result } = renderHook(() => useItemTagsDisplay("song", undefined));

		expect(fetchItemTagsEffect).not.toHaveBeenCalled();
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
		expect(result.current).toStrictEqual([]);
	});

	it("skips fetch and subscription when itemId is whitespace only", () => {
		setupDefaultMocks();

		const { result } = renderHook(() => useItemTagsDisplay("song", "   "));

		expect(fetchItemTagsEffect).not.toHaveBeenCalled();
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
		expect(result.current).toStrictEqual([]);
	});

	it("populates tags from initial fetch", async () => {
		setupDefaultMocks();
		vi.mocked(fetchItemTagsEffect).mockReturnValue(Effect.succeed([SLUG_A, SLUG_B]));

		const { result } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(result.current).toStrictEqual([SLUG_A, SLUG_B]);
		});
	});

	it("adds tag slug on INSERT realtime event", async () => {
		const capture: OnEventCapture = { fn: undefined };
		setupDefaultMocks(capture);
		vi.mocked(fetchItemTagsEffect).mockReturnValue(Effect.succeed([SLUG_A]));

		const { result } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(result.current).toContain(SLUG_A);
		});

		expect(capture.fn).toBeDefined();
		const onEventInsert = forceCast<OnEventFn>(capture.fn);

		await act(async () => {
			await Effect.runPromise(onEventInsert({ eventType: "INSERT", new: { tag_slug: SLUG_B } }));
		});

		expect(result.current).toStrictEqual([SLUG_A, SLUG_B]);
	});

	it("removes tag slug on DELETE realtime event", async () => {
		const capture: OnEventCapture = { fn: undefined };
		setupDefaultMocks(capture);
		vi.mocked(fetchItemTagsEffect).mockReturnValue(Effect.succeed([SLUG_A, SLUG_B]));

		const { result } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(result.current).toStrictEqual([SLUG_A, SLUG_B]);
		});

		expect(capture.fn).toBeDefined();
		const onEventDelete = forceCast<OnEventFn>(capture.fn);

		await act(async () => {
			await Effect.runPromise(onEventDelete({ eventType: "DELETE", old: { tag_slug: SLUG_A } }));
		});

		expect(result.current).toStrictEqual([SLUG_B]);
	});

	it("does not add duplicate slug on repeated INSERT", async () => {
		const capture: OnEventCapture = { fn: undefined };
		setupDefaultMocks(capture);
		vi.mocked(fetchItemTagsEffect).mockReturnValue(Effect.succeed([SLUG_A]));

		const { result } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(result.current).toContain(SLUG_A);
		});

		expect(capture.fn).toBeDefined();
		const onEventDupe = forceCast<OnEventFn>(capture.fn);

		await act(async () => {
			await Effect.runPromise(onEventDupe({ eventType: "INSERT", new: { tag_slug: SLUG_A } }));
		});

		expect(result.current).toStrictEqual([SLUG_A]);
	});

	it("ignores non-record realtime payload", async () => {
		const capture: OnEventCapture = { fn: undefined };
		setupDefaultMocks(capture);
		vi.mocked(fetchItemTagsEffect).mockReturnValue(Effect.succeed([SLUG_A]));

		const { result } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(result.current).toContain(SLUG_A);
		});

		expect(capture.fn).toBeDefined();
		const onEventInvalid = forceCast<OnEventFn>(capture.fn);

		await act(async () => {
			await Effect.runPromise(onEventInvalid("not-a-record"));
		});

		expect(result.current).toStrictEqual([SLUG_A]);
	});

	it("skips subscription when auth token fetch fails", async () => {
		setupDefaultMocks();
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("auth failed"));

		renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(getSupabaseAuthToken).toHaveBeenCalledWith();
		});

		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("skips subscription when supabase client is undefined", async () => {
		setupDefaultMocks();
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(getSupabaseClient).toHaveBeenCalledWith(AUTH_TOKEN);
		});

		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("calls cleanup on unmount", async () => {
		setupDefaultMocks();
		const cleanup = vi.fn();
		vi.mocked(createRealtimeSubscription).mockReturnValue(cleanup);

		const { unmount } = renderHook(() => useItemTagsDisplay("song", ITEM_ID));

		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledWith(
				expect.objectContaining({ tableName: "song_tag" }),
			);
		});

		unmount();

		expect(cleanup).toHaveBeenCalledWith();
	});

	it("passes correct tagTable and filter for playlist item type", async () => {
		setupDefaultMocks();

		renderHook(() => useItemTagsDisplay("playlist", PLAYLIST_ID));

		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledWith(
				expect.objectContaining({
					tableName: "playlist_tag",
					filter: `playlist_id=eq.${PLAYLIST_ID}`,
				}),
			);
		});
	});
});
