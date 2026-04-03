import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import lookupUserByUsernameHandler from "./lookupUserByUsername";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

describe("lookupUserByUsernameHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(lookupUserByUsernameHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing username", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		await expect(Effect.runPromise(lookupUserByUsernameHandler(ctx))).rejects.toThrow(
			/Request must contain username/,
		);
	});

	it("fails when username is empty", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { username: "   " } });

		await expect(Effect.runPromise(lookupUserByUsernameHandler(ctx))).rejects.toThrow(
			/username cannot be empty/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { username: "targetuser" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(lookupUserByUsernameHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("returns ValidationError when user not found", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { username: "nonexistent" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({ userPublicMaybe: undefined });

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(lookupUserByUsernameHandler(ctx))).rejects.toThrow(
			/User "nonexistent" not found/,
		);
	});

	it("returns user_id and username when found (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { username: "targetuser" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			userPublicMaybe: { user_id: "target-456", username: "targetuser" },
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(lookupUserByUsernameHandler(ctx));

		expect(res).toStrictEqual({ user_id: "target-456", username: "targetuser" });
	});
});
