import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/test-utils/makeCtx.mock";
import { ACCESS_CONTROL_MAX_AGE_SEC, HTTP_NO_CONTENT } from "@/shared/constants/http";
import { ONE } from "@/shared/constants/shared-constants";

import corsMiddleware from "./cors";

describe("corsMiddleware", () => {
	it("sets CORS headers and calls next when origin is allowed (production)", async () => {
		const ctx = makeCtx({
			headers: { Origin: "https://allowed.com" },
			env: { ENVIRONMENT: "production" },
		});
		const gaMod = await import("@/api/cors/getAllowedOrigins");
		const gaSpy = vi.spyOn(gaMod, "default").mockReturnValue(["https://allowed.com"]);

		// attach a header spy (framework method used by middleware)
		const headerSpy = vi.fn();
		// @ts-expect-error - test-only augmentation
		ctx.header = headerSpy;

		// ensure non-OPTIONS method
		// @ts-expect-error - test-only augmentation
		ctx.req.method = "GET";

		const next = vi.fn(async () => {
			await Promise.resolve();
			return undefined;
		});

		const res = await corsMiddleware(ctx, next);

		expect(headerSpy).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://allowed.com");
		expect(headerSpy).toHaveBeenCalledWith("Access-Control-Allow-Methods", expect.any(String));

		expect(next).toHaveBeenCalledTimes(ONE);
		expect(res).toBeUndefined();

		gaSpy.mockRestore();
	});

	it("returns a preflight response with CORS headers when OPTIONS and allowed", async () => {
		const origin = "https://allowed-preflight.com";
		const ctx = makeCtx({ headers: { Origin: origin }, env: { ENVIRONMENT: "production" } });
		const headerSpy2 = vi.fn();
		// @ts-expect-error - test-only augmentation
		ctx.header = headerSpy2;

		// OPTIONS preflight
		// @ts-expect-error - test-only augmentation
		ctx.req.method = "OPTIONS";

		const gaMod2 = await import("@/api/cors/getAllowedOrigins");
		const gaSpy2 = vi.spyOn(gaMod2, "default").mockReturnValue([origin]);

		const resp = await corsMiddleware(ctx, () => Promise.resolve());

		expect(resp).toBeInstanceOf(Response);
		expect(resp?.status).toBe(HTTP_NO_CONTENT);
		expect(resp?.headers.get("Access-Control-Allow-Origin")).toBe(origin);
		expect(resp?.headers.get("Access-Control-Max-Age")).toBe(String(ACCESS_CONTROL_MAX_AGE_SEC));

		gaSpy2.mockRestore();
	});

	it("returns 204 without CORS headers when OPTIONS and origin not allowed", async () => {
		const ctx = makeCtx({
			headers: { Origin: "https://bad.com" },
			env: { ENVIRONMENT: "production" },
		});
		const gaMod3 = await import("@/api/cors/getAllowedOrigins");
		const gaSpy3 = vi.spyOn(gaMod3, "default").mockReturnValue(["https://good.com"]);
		// @ts-expect-error - test-only augmentation
		ctx.req.method = "OPTIONS";

		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const resp = await corsMiddleware(ctx, () => Promise.resolve());

		expect(warn).toHaveBeenCalledTimes(ONE);
		expect(resp?.status).toBe(HTTP_NO_CONTENT);
		expect(resp?.headers.get("Access-Control-Allow-Origin")).toBeNull();
		warn.mockRestore();

		gaSpy3.mockRestore();
	});

	it("allows any truthy Origin header in non-production (dev) mode", async () => {
		const ctx = makeCtx({
			headers: { Origin: "https://dev-origin.test" },
			env: { ENVIRONMENT: "development" },
		});

		const headerSpy = vi.fn();
		// @ts-expect-error - test-only augmentation
		ctx.header = headerSpy;
		// @ts-expect-error - test-only augmentation
		ctx.req.method = "GET";

		await corsMiddleware(ctx, () => Promise.resolve());

		expect(headerSpy).toHaveBeenCalledWith(
			"Access-Control-Allow-Origin",
			"https://dev-origin.test",
		);
	});
});
