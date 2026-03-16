import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { UserSessionData } from "@/shared/userSessionData";

import communityPlaylistAdd from "./communityPlaylistAdd";
import makeCommunityPlaylistAddClient from "./communityPlaylistAdd.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const USER_ID = "user-123";
const COMMUNITY_ID = "community-456";
const PLAYLIST_ID = "playlist-789";

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

describe("communityPlaylistAdd", () => {
	it("returns ValidationError when request body is invalid json", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: new Error("parse error") });

		const result = await Effect.runPromise(
			communityPlaylistAdd(ctx).pipe(
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
		const ctx = makeCtx({ body: { playlist_id: PLAYLIST_ID } });

		const result = await Effect.runPromise(
			communityPlaylistAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when user is not owner or admin", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(
			makeCommunityPlaylistAddClient({ requesterRole: "member" }),
		);

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID, playlist_id: PLAYLIST_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityPlaylistAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns DatabaseError when insert fails", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunityPlaylistAddClient({ insertError: true }));

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID, playlist_id: PLAYLIST_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communityPlaylistAdd(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("DatabaseError");
	});

	it("returns success when owner adds playlist", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunityPlaylistAddClient());

		const ctx = makeCtx({
			body: { community_id: COMMUNITY_ID, playlist_id: PLAYLIST_ID },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communityPlaylistAdd(ctx));

		expect(result).toStrictEqual({ success: true });
	});
});
