import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import communitySave from "./communitySave";
import makeCommunitySaveClient from "./communitySave.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});

const VALID_CREATE_BODY = { name: "New Community", slug: "new-community" };
const VALID_UPDATE_BODY = {
	community_id: "comm-123",
	name: "Updated Community",
	slug: "updated-community",
};

describe("communitySave", () => {
	it("returns ValidationError when form validation fails", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: { name: "x", slug: "bad slug!" } });

		const result = await Effect.runPromise(
			communitySave(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when request body is invalid json", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const ctx = makeCtx({ body: new Error("parse error") });

		const result = await Effect.runPromise(
			communitySave(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns ValidationError when user lacks update permission", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		vi.mocked(createClient).mockReturnValue(makeCommunitySaveClient({ userRole: "member" }));

		const ctx = makeCtx({
			body: VALID_UPDATE_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(
			communitySave(ctx).pipe(
				Effect.map(() => ({ ok: true }) as const),
				Effect.catchAll((err) => Effect.succeed({ ok: false, err })),
			),
		);

		expect(result.ok).toBe(false);
		expect(forceCast<{ ok: false; err: Error }>(result).err.constructor.name).toBe(
			"ValidationError",
		);
	});

	it("returns success when creating a new community", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const publicRow = {
			community_id: "new-uuid",
			owner_id: TEST_USER_ID,
			name: "New Community",
			slug: "new-community",
			description: "",
			is_public: false,
			public_notes: "",
		};
		vi.mocked(createClient).mockReturnValue(makeCommunitySaveClient({ publicRow }));

		const ctx = makeCtx({
			body: VALID_CREATE_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communitySave(ctx));

		expect(result).toStrictEqual(publicRow);
	});

	it("returns success when updating an existing community", async () => {
		vi.mocked(getVerifiedUserSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));
		const publicRow = {
			community_id: "comm-123",
			owner_id: TEST_USER_ID,
			name: "Updated Community",
			slug: "updated-community",
			description: "",
			is_public: false,
			public_notes: "",
		};
		vi.mocked(createClient).mockReturnValue(
			makeCommunitySaveClient({ userRole: "owner", publicRow }),
		);

		const ctx = makeCtx({
			body: VALID_UPDATE_BODY,
			env: { VITE_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "key" },
		});

		const result = await Effect.runPromise(communitySave(ctx));

		expect(result).toStrictEqual(publicRow);
	});
});
