import type { PostgrestResponse } from "@supabase/supabase-js";

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import { makeFakeClient } from "@/react/lib/supabase/client/test-util";

import type { InvitationSlice } from "./slice/InvitationSlice.type";

import asPostgrestResponse from "../lib/test-utils/asPostgrestResponse";
import fetchPendingInvitations from "./fetchPendingInvitations";
import makeInvitationSlice from "./slice/makeInvitationSlice.test-util";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedGetToken = vi.mocked(getSupabaseAuthToken);
const mockedGetClient = vi.mocked(getSupabaseClient);
const mockedCallSelect = vi.mocked(callSelect);

/**
 * Create Postgrest-shaped response fixtures used by the invitation tests.
 *
 * The tuple matches the sequence of `callSelect` queries exercised by
 * `fetchPendingInvitations` and keeps the mock data centralized for clarity.
 *
 * @returns Tuple of `PostgrestResponse` fixtures in the order queried:
 *  - resp1: community ids only
 *  - resp2: community with name and slug
 *  - resp3: event ids only
 *  - resp4: event with name and slug
 */
function makeResponses(): [
	PostgrestResponse<unknown>,
	PostgrestResponse<unknown>,
	PostgrestResponse<unknown>,
	PostgrestResponse<unknown>,
] {
	const resp1 = asPostgrestResponse([{ community_id: "1" }]);
	const resp2 = asPostgrestResponse([{ community_id: "1", name: "Com", slug: "com-slug" }]);
	const resp3 = asPostgrestResponse([{ event_id: "e1" }]);
	const resp4 = asPostgrestResponse([
		{ event_id: "e1", event_name: "Event", event_slug: "event-slug" },
	]);

	return [resp1, resp2, resp3, resp4];
}

describe("fetchPendingInvitations", () => {
	it("handles missing Supabase client gracefully", async () => {
		vi.resetAllMocks();
		const setInvitationLoading = vi.fn();
		const setInvitationError = vi.fn();
		const setPendingCommunityInvitations = vi.fn();
		const setPendingEventInvitations = vi.fn();

		mockedGetToken.mockResolvedValueOnce(undefined);
		mockedGetClient.mockReturnValueOnce(undefined);

		/**
		 * Build a synthetic `InvitationSlice` for the "missing client" test.
		 * The returned object implements only the minimal API required by the
		 * slice under test so the logic can be executed in isolation.
		 *
		 * @returns `InvitationSlice` test double
		 */
		function get(): InvitationSlice {
			return makeInvitationSlice({
				setPendingCommunityInvitations,
				setPendingEventInvitations,
				setInvitationLoading,
				setInvitationError,
			});
		}

		await Effect.runPromise(fetchPendingInvitations(get));

		expect(setInvitationLoading).toHaveBeenCalledWith(true);
		expect(setInvitationLoading).toHaveBeenCalledWith(false);
		expect(setInvitationError).toHaveBeenCalledWith(undefined);
	});

	it("maps community and event invitations from queries", async () => {
		vi.resetAllMocks();
		const setInvitationLoading = vi.fn();
		const setInvitationError = vi.fn();
		const setPendingCommunityInvitations = vi.fn();
		const setPendingEventInvitations = vi.fn();

		mockedGetToken.mockResolvedValueOnce("token-123");

		const fakeClient = makeFakeClient();
		mockedGetClient.mockReturnValueOnce(fakeClient);

		const [resp1, resp2, resp3, resp4] = makeResponses();

		mockedCallSelect
			.mockResolvedValueOnce(resp1)
			.mockResolvedValueOnce(resp2)
			.mockResolvedValueOnce(resp3)
			.mockResolvedValueOnce(resp4);

		/**
		 * Build a synthetic `InvitationSlice` used when a Supabase client is
		 * present. This test double supplies no-op implementations of the
		 * slice callbacks so the mapping behavior can be asserted.
		 *
		 * @returns `InvitationSlice` test double
		 */
		function get(): InvitationSlice {
			return makeInvitationSlice({
				setPendingCommunityInvitations,
				setPendingEventInvitations,
				setInvitationLoading,
				setInvitationError,
			});
		}

		await Effect.runPromise(fetchPendingInvitations(get));

		expect(setPendingCommunityInvitations).toHaveBeenCalledWith([
			{
				community_id: "1",
				community_name: "Com",
				community_slug: "com-slug",
			},
		]);

		expect(setPendingEventInvitations).toHaveBeenCalledWith([
			{
				event_id: "e1",
				event_name: "Event",
				event_slug: "event-slug",
			},
		]);

		expect(setInvitationLoading).toHaveBeenCalledWith(false);
		expect(setInvitationError).toHaveBeenCalledWith(undefined);
	});
});
