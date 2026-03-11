import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import type { UserSessionData } from "@/shared/userSessionData";

import communityShareRequestCreate from "./communityShareRequestCreate";
import makeCommunityShareRequestCreateClient from "./communityShareRequestCreate.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const USER_ID = "user-123";
const COMMUNITY_ID = "community-456";

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
		user_id: USER_ID,
	},
	userPublic: { user_id: USER_ID, username: "user" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

describe("communityShareRequestCreate", () => {
	it("returns ValidationError when request body is invalid json", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: new Error("parse error") });

		const result = await Effect.runPromise(
			communityShareRequestCreate(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns ValidationError when community_id is missing", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({
			body: { shared_item_type: "song", shared_item_id: "song-1" },
		});

		const result = await Effect.runPromise(
			communityShareRequestCreate(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns ValidationError when user is not a joined member", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityShareRequestCreateClient({ communityUserError: true }),
		);

		const ctx = makeCtx({
			body: {
				community_id: COMMUNITY_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
			},
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityShareRequestCreate(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns ValidationError when member status is invited not joined", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityShareRequestCreateClient({ communityUserStatus: "invited" }),
		);

		const ctx = makeCtx({
			body: {
				community_id: COMMUNITY_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
			},
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityShareRequestCreate(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns DatabaseError when insert fails", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityShareRequestCreateClient({ insertError: true }),
		);

		const ctx = makeCtx({
			body: {
				community_id: COMMUNITY_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
			},
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityShareRequestCreate(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("DatabaseError");
	});

	it("returns success when member is joined and insert succeeds", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunityShareRequestCreateClient());

		const ctx = makeCtx({
			body: {
				community_id: COMMUNITY_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
				message: "Optional message",
			},
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityShareRequestCreate(ctx));

		expect(result).toStrictEqual({ success: true });
	});
});
