import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import shareListHandler from "./shareList";
import createShareListSupabaseMock from "./shareList.test-util";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

describe("shareListHandler", () => {
	it("fails with ValidationError when view query param is missing", async () => {
		const ctx = makeCtx({
			req: { url: "https://example.test/api/shares/list", method: "GET" },
		});

		await expect(Effect.runPromise(shareListHandler(ctx))).rejects.toThrow(
			/Query parameter 'view' is required/,
		);
	});

	it("fails with ValidationError when view is invalid", async () => {
		const ctx = makeCtx({
			req: { url: "https://example.test/api/shares/list?view=invalid", method: "GET" },
		});

		await expect(Effect.runPromise(shareListHandler(ctx))).rejects.toThrow(
			/view must be one of: sent, received/,
		);
	});

	it("fails with ValidationError when status is invalid", async () => {
		const ctx = makeCtx({
			req: {
				url: "https://example.test/api/shares/list?view=sent&status=invalid",
				method: "GET",
			},
		});

		await expect(Effect.runPromise(shareListHandler(ctx))).rejects.toThrow(
			/status must be one of: pending, accepted, rejected/,
		);
	});

	it("fails with ValidationError when item_type is invalid", async () => {
		const ctx = makeCtx({
			req: {
				url: "https://example.test/api/shares/list?view=received&item_type=invalid",
				method: "GET",
			},
		});

		await expect(Effect.runPromise(shareListHandler(ctx))).rejects.toThrow(
			/item_type must be one of: song, playlist, event, community, user/,
		);
	});

	it("propagates AuthenticationError from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			req: { url: "https://example.test/api/shares/list?view=sent", method: "GET" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(shareListHandler(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("returns empty shares when view is sent and user has no shares", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			req: { url: "https://example.test/api/shares/list?view=sent", method: "GET" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeClient = createShareListSupabaseMock();
		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeClient);

		const result = await Effect.runPromise(shareListHandler(ctx));

		expect(result).toStrictEqual({ shares: [] });
	});
});
