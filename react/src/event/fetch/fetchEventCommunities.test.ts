import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventSlice from "@/react/event/slice/makeEventSlice.test-util";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";

import fetchEventCommunities from "./fetchEventCommunities";

const ONE = 1;
const FIRST_INDEX = 0;

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedGetToken = vi.mocked(getSupabaseAuthToken);
const mockedGetClient = vi.mocked(getSupabaseClient);
const mockedCallSelect = vi.mocked(callSelect);

describe("fetchEventCommunities", () => {
	it("returns empty array and sets loading/communities when no rows", async () => {
		vi.resetAllMocks();

		mockedGetToken.mockResolvedValue("token-123");
		mockedGetClient.mockReturnValue(forceCast(createMinimalSupabaseClient()));
		// First call (community_event) returns empty
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse({ data: [] }));

		const get = makeEventSlice();
		const res = await Effect.runPromise(fetchEventCommunities("evt-1", get));

		expect(res).toStrictEqual([]);
		expect(get().setEventCommunities).toHaveBeenCalledWith([]);
		expect(get().setEventLoading).toHaveBeenLastCalledWith(false);
		expect(get().setEventError).toHaveBeenCalledWith(undefined);
	});

	it("enriches rows with community name and slug", async () => {
		vi.resetAllMocks();

		mockedGetToken.mockResolvedValue("token-xyz");
		mockedGetClient.mockReturnValue(forceCast(createMinimalSupabaseClient()));

		const rawRows = [{ community_id: "c1", event_id: "e1", created_at: "2020-01-01" }];
		const publicRows = [{ community_id: "c1", name: "Community One", slug: "community-one" }];

		// callSelect is called twice: community_event then community_public
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse({ data: rawRows }));
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse({ data: publicRows }));

		const get = makeEventSlice();
		const res = await Effect.runPromise(fetchEventCommunities("e1", get));

		expect(res).toHaveLength(ONE);
		expect(res[FIRST_INDEX]).toMatchObject({
			community_id: "c1",
			event_id: "e1",
			community_name: "Community One",
			community_slug: "community-one",
		});
		expect(get().setEventCommunities).toHaveBeenCalledWith(res);
		expect(get().setEventLoading).toHaveBeenLastCalledWith(false);
	});

	it("rejects when supabase client not available", async () => {
		vi.resetAllMocks();

		mockedGetToken.mockResolvedValue("token-abc");
		mockedGetClient.mockReturnValue(undefined);

		const get = makeEventSlice();
		await expect(Effect.runPromise(fetchEventCommunities("e-no-client", get))).rejects.toThrow(
			"Supabase client not available",
		);

		expect(get().setEventLoading).toHaveBeenLastCalledWith(false);
	});
});
