import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import createShareRecord from "@/api/share/create/shareCreateRecord";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { UserSessionData } from "@/shared/userSessionData";

import shareCreateHandler from "./shareCreate";
import makeShareClient from "./shareCreate.test-util";

vi.mock("@/api/supabase/getSupabaseServerClient");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("./shareCreateRecord");

const SENDER_ID = "sender-1";
const RECIPIENT_ID = "recipient-2";
const SHARE_ID = "share-abc";
const FIRST_CALL = 1;

const SAMPLE_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "s@example.com",
		google_calendar_access: "",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Sender",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: SENDER_ID,
	},
	userPublic: { user_id: SENDER_ID, username: "sender" },
	oauthUserData: { email: "s@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

describe("shareCreateHandler", () => {
	it("returns ValidationError when request is not an object", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: 42 });

		const result = await Effect.runPromise(
			shareCreateHandler(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when recipient_user_id is missing", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({
			body: {
				shared_item_type: "song",
				shared_item_id: "song-1",
				shared_item_name: "Song",
			},
		});

		const result = await Effect.runPromise(
			shareCreateHandler(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when shared_item_type is invalid", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({
			body: {
				recipient_user_id: RECIPIENT_ID,
				shared_item_type: "invalid",
				shared_item_id: "song-1",
				shared_item_name: "Song",
			},
		});

		const result = await Effect.runPromise(
			shareCreateHandler(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when sender and recipient are the same", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({
			body: {
				recipient_user_id: SENDER_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
				shared_item_name: "Song",
			},
		});

		const result = await Effect.runPromise(
			shareCreateHandler(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns shareId when request is valid and createShareRecord succeeds", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(getSupabaseServerClient).mockReturnValue(makeShareClient(SENDER_ID));
		vi.mocked(createShareRecord).mockReturnValue(Effect.succeed({ shareId: SHARE_ID }));

		const ctx = makeCtx({
			body: {
				recipient_user_id: RECIPIENT_ID,
				shared_item_type: "song",
				shared_item_id: "song-1",
				shared_item_name: "Test Song",
			},
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(shareCreateHandler(ctx));

		expect(result).toStrictEqual({ shareId: SHARE_ID });
		expect(vi.mocked(createShareRecord)).toHaveBeenCalledTimes(FIRST_CALL);
	});
});
