import { Effect, Schema } from "effect";
import { verify } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import {
	mockHonoJwtVerifyFailure,
	mockHonoJwtVerifySuccess,
} from "@/api/hono/makeHonoJwt.test-util";
import mockDecodeThrow from "@/api/test-utils/makeDecodeUnknownSync.test-util";
import mockDecodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow.test-util";

import { parseDataFromCookie } from "./parseDataFromCookie";

vi.mock("hono/jwt");
vi.mock("@/shared/validation/decodeUnknownSyncOrThrow");

const TestSchema = Schema.Struct({ foo: Schema.String });

describe("parseDataFromCookie", () => {
	it("returns decoded payload when token present and verification succeeds", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=tok-abc;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		mockHonoJwtVerifySuccess({ foo: "bar" });
		mockDecodeUnknownSyncOrThrow({ foo: "bar" });

		// Act
		const res = await Effect.runPromise(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		);

		// Assert
		expect(res).toStrictEqual({ foo: "bar" });
		expect(vi.mocked(verify)).toHaveBeenCalledWith("tok-abc", "jwt-secret", "HS256");
	});

	it("returns undefined when cookie missing and allowMissing is true", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "other=1;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		// Act
		const res = await Effect.runPromise(
			parseDataFromCookie({
				ctx,
				cookieName: "mycookie",
				schema: TestSchema,
				allowMissing: true,
			}),
		);

		// Assert
		expect(res).toBeUndefined();
	});

	it("throws when cookie missing and allowMissing is false", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({ headers: { Cookie: "" }, env: { SUPABASE_JWT_SECRET: "jwt-secret" } });

		// Act
		const promise = Effect.runPromise(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		);

		// Assert
		await expect(promise).rejects.toThrow(/Failed to extract token from cookie/);
	});

	it("throws when ctx is not provided", async () => {
		// Arrange/Act
		const promise = Effect.runPromise(parseDataFromCookie({ cookieName: "x", schema: TestSchema }));

		// Assert
		await expect(promise).rejects.toThrow(/Missing context when parsing data from cookie/);
	});

	it("returns undefined when verification fails and allowMissing is true", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=badtok;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		mockHonoJwtVerifyFailure(new Error("invalid token"));

		// Act
		const res = await Effect.runPromise(
			parseDataFromCookie({
				ctx,
				cookieName: "mycookie",
				schema: TestSchema,
				allowMissing: true,
			}),
		);

		// Assert
		expect(res).toBeUndefined();
	});

	it("throws when verification fails and allowMissing is false", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=badtok;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		mockHonoJwtVerifyFailure(new Error("invalid token"));

		// Act
		const promise = Effect.runPromise(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		);

		// Assert
		await expect(promise).rejects.toThrow(/JWT verification failed/);
	});

	it("returns undefined when decode fails and allowMissing is true", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=tok;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		mockHonoJwtVerifySuccess({ bad: "payload" });
		mockDecodeThrow(new Error("schema mismatch"));

		// Act
		const res = await Effect.runPromise(
			parseDataFromCookie({
				ctx,
				cookieName: "mycookie",
				schema: TestSchema,
				allowMissing: true,
			}),
		);

		// Assert
		expect(res).toBeUndefined();
	});

	it("throws when decode fails and allowMissing is false", async () => {
		// Arrange
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=tok;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		mockHonoJwtVerifySuccess({ bad: "payload" });
		mockDecodeThrow(new Error("schema mismatch"));

		// Act
		const promise = Effect.runPromise(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		);

		// Assert
		await expect(promise).rejects.toThrow(/Failed to decode cookie data/);
	});
});
