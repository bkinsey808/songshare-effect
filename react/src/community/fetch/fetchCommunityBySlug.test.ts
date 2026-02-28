import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import fetchCommunityBySlug from "./fetchCommunityBySlug";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

describe("fetchCommunityBySlug", () => {
	const FIRST_CALL = 1;

	it("fetches and populates community, members, and events", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token123");
		vi.mocked(getSupabaseClient).mockReturnValue(forceCast({}));

		const communityRow = {
			community_id: "cid",
			owner_id: "owner1",
			name: "Name",
			slug: "cslug",
			description: "d",
			is_public: true,
			public_notes: undefined,
			created_at: "2020",
			updated_at: "2020",
		};

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse({ data: [communityRow] }))
			.mockResolvedValueOnce(
				asPostgrestResponse({
					data: [
						{
							user_id: "u1",
							role: "member",
							community_id: "cid",
							status: "joined",
							joined_at: "2020-01-01",
						},
					],
				}),
			)
			.mockResolvedValueOnce(asPostgrestResponse({ data: [{ user_id: "u1", username: "alice" }] }))
			.mockResolvedValueOnce(
				asPostgrestResponse({
					data: [{ event_id: "e1", community_id: "cid", created_at: "2020-01-01" }],
				}),
			)
			.mockResolvedValueOnce(
				asPostgrestResponse({ data: [{ event_id: "e1", event_name: "E1", event_slug: "e1" }] }),
			);

		const setCurrentCommunity = vi.fn();
		const setMembers = vi.fn();
		const setCommunityEvents = vi.fn();
		const setCommunityLoading = vi.fn();
		const setCommunityError = vi.fn();

		function get(): CommunitySlice {
			return forceCast({
				setCurrentCommunity,
				setMembers,
				setCommunityEvents,
				setCommunityLoading,
				setCommunityError,
			});
		}

		const result = await Effect.runPromise(fetchCommunityBySlug("cslug", get));

		expect(result.community_id).toBe("cid");
		expect(setCurrentCommunity).toHaveBeenNthCalledWith(
			FIRST_CALL,
			expect.objectContaining({ community_id: "cid" }),
		);
		expect(setMembers).toHaveBeenNthCalledWith(FIRST_CALL, expect.any(Array));
		expect(setCommunityEvents).toHaveBeenNthCalledWith(FIRST_CALL, expect.any(Array));
		expect(setMembers).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ username: "alice" })]),
		);
	});

	it("sets error when community not found", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token123");
		vi.mocked(getSupabaseClient).mockReturnValue(forceCast({}));
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse({ data: [] }));

		const setCurrentCommunity = vi.fn();
		const setMembers = vi.fn();
		const setCommunityEvents = vi.fn();
		const setCommunityLoading = vi.fn();
		const setCommunityError = vi.fn();

		function get(): CommunitySlice {
			return forceCast({
				setCurrentCommunity,
				setMembers,
				setCommunityEvents,
				setCommunityLoading,
				setCommunityError,
			});
		}

		await expect(Effect.runPromise(fetchCommunityBySlug("nope", get))).rejects.toThrow(
			/Community not found/,
		);

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(setCommunityError).toHaveBeenCalledWith(expect.any(String));
	});
});
