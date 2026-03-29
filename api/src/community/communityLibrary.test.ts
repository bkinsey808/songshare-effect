import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import communityLibrary from "./communityLibrary";
import makeCommunityLibraryClient from "./communityLibrary.test-util";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});

describe("communityLibrary", () => {
	it("propagates authentication failure from getVerifiedUserSession", async () => {
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		const ctx = makeCtx();

		await expect(Effect.runPromise(communityLibrary(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("returns empty array when user has no communities", async () => {
		vi.resetAllMocks();
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const fakeSupabase = makeCommunityLibraryClient({ communityUserData: [] });

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityLibrary(ctx));

		expect(result).toStrictEqual([]);
	});

	it("returns communities when user has memberships", async () => {
		vi.resetAllMocks();
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const communities = [
			{
				community_id: "comm-1",
				created_at: "2026-01-01T00:00:00Z",
				owner_id: "owner-1",
				community_name: "Test Community",
				community_slug: "test-community",
				description: "A test",
				is_public: true,
				public_notes: "",
				updated_at: "2026-01-01T00:00:00Z",
			},
		];

		const fakeSupabase = makeCommunityLibraryClient({
			communityUserData: [{ community_id: "comm-1" }],
			communityPublicData: communities,
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityLibrary(ctx));

		expect(result).toStrictEqual(communities);
	});
});
