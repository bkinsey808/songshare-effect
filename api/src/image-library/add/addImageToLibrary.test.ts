import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/api/test-utils/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import addImageToLibrary from "./addImageToLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

const VALID_IMAGE_ID = "img-1";
const CREATED_AT = "2026-01-01T00:00:00Z";

describe("addImageToLibrary", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(addImageToLibrary(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing image_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		await expect(Effect.runPromise(addImageToLibrary(ctx))).rejects.toThrow(
			/Request must contain image_id/,
		);
	});

	it("fails when image_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: 123 } });

		await expect(Effect.runPromise(addImageToLibrary(ctx))).rejects.toThrow(
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

		await expect(Effect.runPromise(addImageToLibrary(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("inserts into image_library and returns created entry (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: VALID_IMAGE_ID } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imageLibraryInsertRows: [
				{
					image_id: VALID_IMAGE_ID,
					created_at: CREATED_AT,
				},
			],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addImageToLibrary(ctx));

		expect(res).toStrictEqual({
			image_id: VALID_IMAGE_ID,
			created_at: CREATED_AT,
		});
	});
});
