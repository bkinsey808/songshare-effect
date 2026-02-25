import { Effect } from "effect";
import { verify } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import {
	mockHonoJwtVerifyFailure,
	mockHonoJwtVerifySuccess,
} from "@/api/hono/makeHonoJwt.test-util";

import verifyUserSessionToken from "./verifyUserSessionToken";

vi.mock("hono/jwt");

describe("verifyUserSessionToken", () => {
	it("resolves with decoded payload when verify succeeds", async () => {
		vi.resetAllMocks();

		const payload = { sub: "user-1", foo: "bar" };
		mockHonoJwtVerifySuccess(payload);

		const result = await Effect.runPromise(
			verifyUserSessionToken("token-abc", { JWT_SECRET: "s3cr3t" }),
		);

		expect(result).toStrictEqual(payload);
		expect(vi.mocked(verify)).toHaveBeenCalledWith("token-abc", "s3cr3t", "HS256");
	});

	it("fails with AuthenticationError when JWT_SECRET is missing", async () => {
		vi.resetAllMocks();

		await expect(
			Effect.runPromise(
				verifyUserSessionToken("token-abc", {
					/* no JWT_SECRET */
				}),
			),
		).rejects.toThrow(/Missing JWT_SECRET/);

		expect(vi.mocked(verify)).not.toHaveBeenCalled();
	});

	it("maps verify rejection (Error) to AuthenticationError with original message", async () => {
		vi.resetAllMocks();

		mockHonoJwtVerifyFailure(new Error("invalid token"));

		await expect(
			Effect.runPromise(verifyUserSessionToken("token-abc", { JWT_SECRET: "s3cr3t" })),
		).rejects.toThrow(/invalid token/);

		expect(vi.mocked(verify)).toHaveBeenCalledWith("token-abc", "s3cr3t", "HS256");
	});

	it("maps verify rejection (non-Error) to AuthenticationError with stringified message", async () => {
		vi.resetAllMocks();

		mockHonoJwtVerifyFailure("string-error");

		await expect(
			Effect.runPromise(verifyUserSessionToken("token-abc", { JWT_SECRET: "s3cr3t" })),
		).rejects.toThrow(/string-error/);
	});
});
