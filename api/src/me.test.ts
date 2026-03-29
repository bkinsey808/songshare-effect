import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import me from "./me";

vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});

describe("me", () => {
	it("propagates authentication failure from getVerifiedUserSession", async () => {
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		const ctx = makeCtx();

		await expect(Effect.runPromise(me(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("returns AuthenticationError when IP mismatch", async () => {
		vi.resetAllMocks();
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.succeed<UserSessionData>({ ...SAMPLE_SESSION, ip: "192.168.1.1" }),
		);

		const ctx = makeCtx();
		// getIpAddress returns 127.0.0.1 when no headers; session has 192.168.1.1
		await expect(Effect.runPromise(me(ctx))).rejects.toThrow(/IP address mismatch/);
	});

	it("returns session when IP matches", async () => {
		vi.resetAllMocks();
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const ctx = makeCtx();
		const result = await Effect.runPromise(me(ctx));

		expect(result).toStrictEqual(SAMPLE_SESSION);
	});
});
