import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityUser } from "../community-types";
import fetchCommunityMembers from "./fetchCommunityMembers";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");

const mockedCallSelect = vi.mocked(callSelect);

const ONE_CALL = 1;
const TWO_CALLS = 2;
const SECOND_CALL = 2;
const EXPECTED_ONE_MEMBER = 1;
const EXPECTED_TWO_MEMBERS = 2;

describe("fetchCommunityMembers", () => {
	const fakeClient = forceCast<SupabaseClientLike<Database>>({});

	it("returns empty array when community has no members", async () => {
		vi.resetAllMocks();
		mockedCallSelect.mockResolvedValueOnce(asPostgrestResponse<CommunityUser[]>({ data: [] }));

		const result = await Effect.runPromise(
			fetchCommunityMembers(fakeClient, "community-1", "owner-1"),
		);

		expect(result).toStrictEqual([]);
		expect(mockedCallSelect).toHaveBeenCalledTimes(ONE_CALL);
		expect(mockedCallSelect).toHaveBeenCalledWith(
			fakeClient,
			"community_user",
			expect.objectContaining({ eq: { col: "community_id", val: "community-1" } }),
		);
	});

	it("returns enriched members with username and normalizes owner role", async () => {
		vi.resetAllMocks();
		const communityUsers: CommunityUser[] = [
			{
				community_id: "community-1",
				user_id: "owner-1",
				role: "member",
				status: "joined",
				joined_at: "2024-01-01",
			},
			{
				community_id: "community-1",
				user_id: "user-2",
				role: "community_admin",
				status: "joined",
				joined_at: "2024-01-02",
			},
		];

		const users = [
			{ user_id: "owner-1", username: "owner" },
			{ user_id: "user-2", username: "alice" },
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityUser[]>({ data: communityUsers }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{ user_id: string; username: string }>({
					data: users,
				}),
			);

		const result = await Effect.runPromise(
			fetchCommunityMembers(fakeClient, "community-1", "owner-1"),
		);

		expect(result).toHaveLength(EXPECTED_TWO_MEMBERS);
		const [firstMember, secondMember] = result;
		expect(firstMember).toMatchObject({
			community_id: "community-1",
			user_id: "owner-1",
			username: "owner",
			role: "owner",
		});
		expect(secondMember).toMatchObject({
			community_id: "community-1",
			user_id: "user-2",
			username: "alice",
			role: "community_admin",
		});

		expect(mockedCallSelect).toHaveBeenCalledTimes(TWO_CALLS);
		expect(mockedCallSelect).toHaveBeenNthCalledWith(
			SECOND_CALL,
			fakeClient,
			"user_public",
			expect.objectContaining({
				cols: "user_id, username",
				in: { col: "user_id", vals: ["owner-1", "user-2"] },
			}),
		);
	});

	it("leaves username undefined when user not in user_public", async () => {
		vi.resetAllMocks();
		const communityUsers: CommunityUser[] = [
			{
				community_id: "community-1",
				user_id: "user-1",
				role: "member",
				status: "joined",
				joined_at: "2024-01-01",
			},
		];

		mockedCallSelect
			.mockResolvedValueOnce(asPostgrestResponse<CommunityUser[]>({ data: communityUsers }))
			.mockResolvedValueOnce(
				asPostgrestResponse<{ user_id: string; username: string }>({
					data: [],
				}),
			);

		const result = await Effect.runPromise(
			fetchCommunityMembers(fakeClient, "community-1", "other-owner"),
		);

		expect(result).toHaveLength(EXPECTED_ONE_MEMBER);
		const [firstMember] = result;
		expect(firstMember).toMatchObject({
			community_id: "community-1",
			user_id: "user-1",
			role: "member",
		});
		expect(firstMember?.username).toBeUndefined();
	});
});
