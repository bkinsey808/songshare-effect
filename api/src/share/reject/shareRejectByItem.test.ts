import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import createShareListSupabaseMock from "../list/shareList.test-util";
import shareRejectByItemHandler from "./shareRejectByItem";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

describe("shareRejectByItemHandler", () => {
	it("fails with ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });

		await expect(Effect.runPromise(shareRejectByItemHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails with ValidationError when shared_item_type is missing", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { shared_item_id: "item-1" } });

		await expect(Effect.runPromise(shareRejectByItemHandler(ctx))).rejects.toThrow(
			/shared_item_type must be one of/,
		);
	});

	it("fails with ValidationError when shared_item_type is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { shared_item_type: "invalid", shared_item_id: "item-1" } });

		await expect(Effect.runPromise(shareRejectByItemHandler(ctx))).rejects.toThrow(
			/shared_item_type must be one of/,
		);
	});

	it("fails with ValidationError when shared_item_id is empty", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { shared_item_type: "song", shared_item_id: "" } });

		await expect(Effect.runPromise(shareRejectByItemHandler(ctx))).rejects.toThrow(
			/shared_item_id must be a non-empty string/,
		);
	});

	it("propagates AuthenticationError from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { shared_item_type: "song", shared_item_id: "song-1" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(shareRejectByItemHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("returns success with rejected_count 0 when no matching shares", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { shared_item_type: "song", shared_item_id: "song-1" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeClient = createShareListSupabaseMock();
		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeClient);

		const result = await Effect.runPromise(shareRejectByItemHandler(ctx));

		expect(result).toStrictEqual({ success: true, rejected_count: 0 });
	});
});
