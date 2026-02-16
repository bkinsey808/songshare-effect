import { Schema } from "effect";
import { verify } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/test-utils/makeCtx.mock";
import { mockDecodeReturn, mockDecodeThrow } from "@/api/test-utils/makeDecodeUnknownSync.mock";
import { mockVerifySuccess, mockVerifyFailure } from "@/api/test-utils/makeHonoJwt.mock";

import { parseDataFromCookie } from "./parseDataFromCookie";

vi.mock("hono/jwt");
vi.mock("@/shared/validation/decodeUnknownSyncOrThrow");

const TestSchema = Schema.Struct({ foo: Schema.String });

describe("parseDataFromCookie", () => {
	it("returns decoded payload when token present and verification succeeds", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=tok-abc;" },
			env: { JWT_SECRET: "jwt-secret" },
		});

		mockVerifySuccess({ foo: "bar" });
		mockDecodeReturn({ foo: "bar" });

		const res = await parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema });
		expect(res).toStrictEqual({ foo: "bar" });
		expect(vi.mocked(verify)).toHaveBeenCalledWith("tok-abc", "jwt-secret", "HS256");
	});

	it("returns undefined when cookie missing and allowMissing is true", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ headers: { Cookie: "other=1;" }, env: { JWT_SECRET: "jwt-secret" } });

		const res = await parseDataFromCookie({
			ctx,
			cookieName: "mycookie",
			schema: TestSchema,
			allowMissing: true,
		});
		expect(res).toBeUndefined();
	});

	it("throws when cookie missing and allowMissing is false", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ headers: { Cookie: "" }, env: { JWT_SECRET: "jwt-secret" } });

		await expect(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		).rejects.toThrow(/Failed to extract token from cookie/);
	});

	it("throws when ctx is not provided", async () => {
		await expect(
			// intentionally omit `ctx` to exercise the missing-context branch
			parseDataFromCookie({ cookieName: "x", schema: TestSchema }),
		).rejects.toThrow(/Missing context when parsing data from cookie/);
	});

	it("returns undefined when verification fails and allowMissing is true", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=badtok;" },
			env: { JWT_SECRET: "jwt-secret" },
		});

		mockVerifyFailure(new Error("invalid token"));

		const res = await parseDataFromCookie({
			ctx,
			cookieName: "mycookie",
			schema: TestSchema,
			allowMissing: true,
		});
		expect(res).toBeUndefined();
	});

	it("throws when verification fails and allowMissing is false", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=badtok;" },
			env: { JWT_SECRET: "jwt-secret" },
		});

		mockVerifyFailure(new Error("invalid token"));

		await expect(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		).rejects.toThrow(/Failed to parse data from cookie/);
	});

	it("returns undefined when decode fails and allowMissing is true", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=tok;" },
			env: { JWT_SECRET: "jwt-secret" },
		});

		mockVerifySuccess({ bad: "payload" });
		mockDecodeThrow(new Error("schema mismatch"));

		const res = await parseDataFromCookie({
			ctx,
			cookieName: "mycookie",
			schema: TestSchema,
			allowMissing: true,
		});
		expect(res).toBeUndefined();
	});

	it("throws when decode fails and allowMissing is false", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			headers: { Cookie: "mycookie=tok;" },
			env: { JWT_SECRET: "jwt-secret" },
		});

		mockVerifySuccess({ bad: "payload" });
		mockDecodeThrow(new Error("schema mismatch"));

		await expect(
			parseDataFromCookie({ ctx, cookieName: "mycookie", schema: TestSchema }),
		).rejects.toThrow(/Failed to parse data from cookie/);
	});
});
