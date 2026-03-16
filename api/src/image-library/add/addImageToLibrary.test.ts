import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import type { UserSessionData } from "@/shared/userSessionData";

import addImageToLibrary from "./addImageToLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "u@example.com",
		google_calendar_access: "none",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: "user-123",
	},
	userPublic: { user_id: "user-123", username: "testuser" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

const VALID_IMAGE_ID = "img-1";
const IMAGE_OWNER_ID = "owner-1";
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

	it("fails when image is not found in image_public", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: VALID_IMAGE_ID } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imagePublicSelectSingleRow: undefined,
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addImageToLibrary(ctx))).rejects.toThrow(/Image not found/);
	});

	it("inserts into image_library and returns created entry (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { image_id: VALID_IMAGE_ID } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			imagePublicSelectSingleRow: { user_id: IMAGE_OWNER_ID },
			imageLibraryInsertRows: [
				{
					user_id: "user-123",
					image_id: VALID_IMAGE_ID,
					image_owner_id: IMAGE_OWNER_ID,
					created_at: CREATED_AT,
				},
			],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addImageToLibrary(ctx));

		expect(res).toStrictEqual({
			user_id: "user-123",
			image_id: VALID_IMAGE_ID,
			image_owner_id: IMAGE_OWNER_ID,
			created_at: CREATED_AT,
		});
	});
});
