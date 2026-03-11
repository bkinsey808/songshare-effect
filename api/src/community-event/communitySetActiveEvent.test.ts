import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import type { UserSessionData } from "@/shared/userSessionData";

import communitySetActiveEvent from "./communitySetActiveEvent";
import makeCommunitySetActiveEventClient from "./communitySetActiveEvent.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const USER_ID = "user-123";
const COMMUNITY_ID = "community-456";
const EVENT_ID = "event-789";

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

describe("communitySetActiveEvent", () => {
	it("returns ValidationError when request body is invalid json", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: new Error("parse error") });

		const result = await Effect.runPromise(
			communitySetActiveEvent(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns ValidationError when community_id is missing", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: {} });

		const result = await Effect.runPromise(
			communitySetActiveEvent(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns ValidationError when user is not owner or admin", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunitySetActiveEventClient({ requesterRole: "member" }),
		);

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID, event_id: EVENT_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communitySetActiveEvent(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns success when owner sets active event", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunitySetActiveEventClient());

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID, event_id: EVENT_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communitySetActiveEvent(ctx));

		expect(result).toStrictEqual({ success: true });
	});

	it("returns success when owner clears active event", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunitySetActiveEventClient());

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communitySetActiveEvent(ctx));

		expect(result).toStrictEqual({ success: true });
	});
});
