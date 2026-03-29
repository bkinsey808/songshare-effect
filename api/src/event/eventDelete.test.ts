import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import eventDelete from "./eventDelete";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = TEST_USER_ID;

describe("eventDelete", () => {
	it("deletes event when user is owner (happy path)", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleRow: { owner_id: SAMPLE_USER_ID },
		});

		const res = await Effect.runPromise(eventDelete(ctx));
		expect(res).toStrictEqual({ success: true });
	});

	it("fails when user is not the owner", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleRow: { owner_id: "other-id" },
		});

		await expect(Effect.runPromise(eventDelete(ctx))).rejects.toThrow(
			/Only the event owner can delete this event/,
		);
	});

	it("fails when DB returns an error verifying owner", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleError: { message: "boom" },
		});

		await expect(Effect.runPromise(eventDelete(ctx))).rejects.toThrow(/boom/);
	});

	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(eventDelete(ctx))).rejects.toThrow(/Invalid JSON body/);
	});
});
