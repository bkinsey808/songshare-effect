import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import imageUpdate from "./imageUpdate";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = TEST_USER_ID;
const IMAGE_ID = "img-1";

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({
	user: {
		user_id: SAMPLE_USER_ID,
	},
});

const VALID_BODY = {
	image_id: IMAGE_ID,
	image_name: "My Image",
	description: "A description",
	alt_text: "Alt text",
	focal_point_x: 20,
	focal_point_y: 80,
};

const UPDATED_ROW = {
	image_id: IMAGE_ID,
	image_name: "My Image",
	description: "A description",
	alt_text: "Alt text",
	focal_point_x: 20,
	focal_point_y: 80,
	user_id: SAMPLE_USER_ID,
};

describe("imageUpdate", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);
		await expect(Effect.runPromise(imageUpdate(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing image_id", async () => {
		const ctx = makeCtx({
			body: { image_name: "Name", description: "Desc", alt_text: "Alt" },
		});
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);
		await expect(Effect.runPromise(imageUpdate(ctx))).rejects.toThrow(
			/image_id must be a non-empty string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(imageUpdate(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("fails when image not found", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imagePublicSelectSingleRow: undefined,
		});

		vi.mocked(createClient).mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(imageUpdate(ctx))).rejects.toThrow(/Image not found/);
	});

	it("fails when user does not own image", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imagePublicSelectSingleRow: { user_id: "other-user" },
			imagePublicSelectFullRow: undefined,
		});

		vi.mocked(createClient).mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(imageUpdate(ctx))).rejects.toThrow(
			/You do not have permission to edit this image/,
		);
	});

	it("updates image and returns refreshed row (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: VALID_BODY });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imagePublicSelectSingleRow: { user_id: SAMPLE_USER_ID },
			imagePublicSelectFullRow: UPDATED_ROW,
		});

		vi.mocked(createClient).mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(imageUpdate(ctx));

		expect(res).toStrictEqual(UPDATED_ROW);
	});
});
