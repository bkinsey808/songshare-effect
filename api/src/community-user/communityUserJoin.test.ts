import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import communityUserJoin from "./communityUserJoin";
import makeCommunityUserJoinClient from "./communityUserJoin.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const COMMUNITY_ID = "community-456";

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});

describe("communityUserJoin", () => {
	it("returns ValidationError when request body is invalid json", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: new Error("parse error") });

		const result = await Effect.runPromise(
			communityUserJoin(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when community_id is missing", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: {} });

		const result = await Effect.runPromise(
			communityUserJoin(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when user was kicked", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserJoinClient({ existingMember: { status: "kicked", role: "member" } }),
		);

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityUserJoin(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns success early when user already joined", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserJoinClient({ existingMember: { status: "joined", role: "member" } }),
		);

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityUserJoin(ctx));

		expect(result).toStrictEqual({ success: true });
	});

	it("returns success when user joins via update (existing invited)", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserJoinClient({
				existingMember: { status: "invited", role: "member" },
				communityEvents: [{ event_id: "evt-1" }],
			}),
		);

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityUserJoin(ctx));

		expect(result).toStrictEqual({ success: true });
	});

	it("returns success when user joins via insert (new member)", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunityUserJoinClient({ communityEvents: [] }));

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityUserJoin(ctx));

		expect(result).toStrictEqual({ success: true });
	});
});
