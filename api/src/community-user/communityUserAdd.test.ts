import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { UserSessionData } from "@/shared/userSessionData";

import communityUserAdd from "./communityUserAdd";
import makeCommunityUserAddClient from "./communityUserAdd.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const REQUESTER_ID = "requester-123";
const TARGET_ID = "target-456";
const COMMUNITY_ID = "community-789";

const SAMPLE_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "u@example.com",
		google_calendar_access: "",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: REQUESTER_ID,
	},
	userPublic: { user_id: REQUESTER_ID, username: "user" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

const VALID_BODY = {
	community_id: COMMUNITY_ID,
	user_id: TARGET_ID,
	role: "member" as const,
};

describe("communityUserAdd", () => {
	it("returns ValidationError when request body is invalid json", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: new Error("parse error") });

		const result = await Effect.runPromise(
			communityUserAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when requester cannot manage members", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserAddClient({ requesterRole: "member" }),
		);

		const ctx = makeCtx({
			body: VALID_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityUserAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when target user not found", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserAddClient({ targetUserExists: false }),
		);

		const ctx = makeCtx({
			body: VALID_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityUserAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when user already a member", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserAddClient({ existingMembership: { status: "joined" } }),
		);

		const ctx = makeCtx({
			body: VALID_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityUserAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when user already invited", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserAddClient({ existingMembership: { status: "invited" } }),
		);

		const ctx = makeCtx({
			body: VALID_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityUserAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns success when owner adds member", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityUserAddClient({ communityEvents: [{ event_id: "evt-1" }] }),
		);

		const ctx = makeCtx({
			body: VALID_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityUserAdd(ctx));

		expect(result).toStrictEqual({ success: true });
	});
});
