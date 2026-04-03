import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import removeImageFromLibrary from "./removeImageFromLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

const VALID_IMAGE_ID = "img-1";

describe("removeImageFromLibrary", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(removeImageFromLibrary(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing image_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(removeImageFromLibrary(ctx))).rejects.toThrow(
			/Request must contain image_id/,
		);
	});

	it("fails when image_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: 123 } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(removeImageFromLibrary(ctx))).rejects.toThrow(
			/image_id must be a non-empty string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: VALID_IMAGE_ID } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(removeImageFromLibrary(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when delete returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: VALID_IMAGE_ID } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imageLibraryDeleteError: new Error("delete failed"),
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(removeImageFromLibrary(ctx))).rejects.toThrow(/delete failed/);
	});

	it("deletes from image_library and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: VALID_IMAGE_ID } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(removeImageFromLibrary(ctx));

		expect(res).toStrictEqual({ success: true });
	});
});
