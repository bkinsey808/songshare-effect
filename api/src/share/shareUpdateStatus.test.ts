import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import addPlaylistSongsToUserLibrary from "@/api/playlist-library/addPlaylistSongsToUserLibrary";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import type { UserSessionData } from "@/shared/userSessionData";

import shareUpdateStatusHandler from "./shareUpdateStatus";
import makeShareUpdateStatusClient, {
	RECIPIENT_ID,
} from "./shareUpdateStatus.test-util";

vi.mock("@/api/supabase/getSupabaseServerClient");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/playlist-library/addPlaylistSongsToUserLibrary");

const SHARE_ID = "share-123";
const FIRST_CALL = 1;

const SAMPLE_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "r@example.com",
		google_calendar_access: "",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Recipient",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: RECIPIENT_ID,
	},
	userPublic: { user_id: RECIPIENT_ID, username: "recipient" },
	oauthUserData: { email: "r@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

describe("shareUpdateStatusHandler", () => {
	it("returns ValidationError when request is not an object", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: 42 });

		const result = await Effect.runPromise(
			shareUpdateStatusHandler(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns ValidationError when status is invalid", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({
			body: { share_id: SHARE_ID, status: "invalid" },
		});

		const result = await Effect.runPromise(
			shareUpdateStatusHandler(ctx).pipe(
				Effect.map(() => ({ ok: true } as const)),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe("ValidationError");
	});

	it("returns success when request is valid and status is accepted", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(getSupabaseServerClient).mockReturnValue(
			makeShareUpdateStatusClient({
				shared_item_type: "song",
				shared_item_id: "song-1",
				sender_user_id: "sender-1",
			}),
		);
		vi.mocked(addPlaylistSongsToUserLibrary).mockReturnValue(Effect.succeed(undefined));

		const ctx = makeCtx({
			body: { share_id: SHARE_ID, status: "accepted" },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(shareUpdateStatusHandler(ctx));

		expect(result).toStrictEqual({ success: true });
	});

	it("returns success when status is rejected", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(getSupabaseServerClient).mockReturnValue(
			makeShareUpdateStatusClient({
				shared_item_type: "song",
				shared_item_id: "song-1",
				sender_user_id: "sender-1",
			}),
		);

		const ctx = makeCtx({
			body: { share_id: SHARE_ID, status: "rejected" },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(shareUpdateStatusHandler(ctx));

		expect(result).toStrictEqual({ success: true });
		expect(vi.mocked(addPlaylistSongsToUserLibrary)).not.toHaveBeenCalled();
	});

	it("calls addPlaylistSongsToUserLibrary when accepting playlist share", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(getSupabaseServerClient).mockReturnValue(
			makeShareUpdateStatusClient({
				shared_item_type: "playlist",
				shared_item_id: "playlist-1",
				sender_user_id: "sender-1",
			}),
		);
		vi.mocked(addPlaylistSongsToUserLibrary).mockReturnValue(Effect.succeed(undefined));

		const ctx = makeCtx({
			body: { share_id: SHARE_ID, status: "accepted" },
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		await Effect.runPromise(shareUpdateStatusHandler(ctx));

		expect(vi.mocked(addPlaylistSongsToUserLibrary)).toHaveBeenCalledTimes(FIRST_CALL);
		expect(vi.mocked(addPlaylistSongsToUserLibrary)).toHaveBeenCalledWith(
			expect.anything(),
			RECIPIENT_ID,
			"playlist-1",
		);
	});
});
