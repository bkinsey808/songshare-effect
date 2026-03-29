import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import imageDelete from "./imageDelete";
import makeImageDeleteClient from "./imageDelete.test-util";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/storage/getStorageAdapter");

const SAMPLE_USER_ID = TEST_USER_ID;

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({
	user: {
		user_id: SAMPLE_USER_ID,
	},
});

describe("imageDelete", () => {
	it("deletes image when payload is valid and user owns image", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { image_id: "img-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const storageRemove = vi.fn().mockResolvedValue(undefined);
		const getStorageAdapter = await import("@/api/storage/getStorageAdapter");
		vi.mocked(getStorageAdapter.default).mockReturnValue(forceCast({ remove: storageRemove }));

		const fakeClient = makeImageDeleteClient({
			imagePublicSelect: {
				data: { r2_key: "images/user/img-1.png", user_id: SAMPLE_USER_ID },
				error: undefined,
			},
		});
		vi.mocked(createClient).mockReturnValue(fakeClient);

		const res = await Effect.runPromise(imageDelete(ctx));
		expect(res).toStrictEqual({ success: true });
		expect(storageRemove).toHaveBeenCalledWith("images/user/img-1.png");
	});

	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(imageDelete(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing image_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(imageDelete(ctx))).rejects.toThrow(
			/Request must contain image_id/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: "img-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not auth" })),
		);

		await expect(Effect.runPromise(imageDelete(ctx))).rejects.toThrow(/Not auth/);
	});

	it("fails when image not found", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: "img-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const fakeClient = makeImageDeleteClient({
			imagePublicSelect: {
				data: makeNull(),
				error: { message: "not found" },
			},
		});
		vi.mocked(createClient).mockReturnValue(fakeClient);

		await expect(Effect.runPromise(imageDelete(ctx))).rejects.toThrow(/Image not found/);
	});

	it("fails when user does not own image", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: "img-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const fakeClient = makeImageDeleteClient({
			imagePublicSelect: {
				data: { r2_key: "path", user_id: "other-user" },
				error: undefined,
			},
		});
		vi.mocked(createClient).mockReturnValue(fakeClient);

		await expect(Effect.runPromise(imageDelete(ctx))).rejects.toThrow(
			/You do not have permission to delete this image/,
		);
	});
});
