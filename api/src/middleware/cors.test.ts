import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import { ACCESS_CONTROL_MAX_AGE_SEC, HTTP_NO_CONTENT } from "@/shared/constants/http";
import { ONE } from "@/shared/constants/shared-constants";

import corsMiddleware from "./cors";

describe("corsMiddleware", () => {
	it("sets CORS headers and calls next when origin is allowed (production)", async () => {
		/**
		 * Spy for the response header helper.  The CORS middleware calls
		 * `ctx.header(name, value)` when an origin is allowed; by attaching this
		 * fake we can assert that the correct headers were written. This has no
		 * relationship to the request `Origin` header (that value is supplied in
		 * the `makeCtx` options above).
		 */
		const headerSpy = vi.fn();

		/**
		 * Fake Hono context used by the middleware. `makeCtx` builds a minimal
		 * object with the fields our middleware touches; we override the `headers`
		 * and `env` here to simulate a request coming from an allowed origin, and
		 * pass in `headerSpy`/`req.method` so the middleware can write response
		 * headers and execute as if it were handling a GET request.
		 */
		const ctx = makeCtx({
			headers: { Origin: "https://allowed.com" },
			env: { ENVIRONMENT: "production", ALLOWED_ORIGINS: "https://allowed.com" },
			header: headerSpy,
			req: { method: "GET" },
		});

		/**
		 * Stand‑in for the downstream middleware. We use a spy so we can assert
		 * that our CORS layer invoked `next()` exactly once when the origin was
		 * allowed; the async function simply resolves to `undefined` to mimic the
		 * behaviour of a real handler without adding side effects.
		 */
		const next = vi.fn(async () => {
			await Promise.resolve();
			return undefined;
		});

		/**
		 * Result returned by the middleware.  In the non‑preflight path the
		 * handler returns `undefined` (passing control to downstream middleware);
		 * preflight or rejection cases yield a `Response` instance instead.
		 */
		const res = await corsMiddleware(ctx, next);

		expect(headerSpy).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://allowed.com");
		expect(headerSpy).toHaveBeenCalledWith(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		);

		expect(next).toHaveBeenCalledTimes(ONE);

		// middleware returns `undefined` when it lets the chain continue.
		// an actual Response object is only produced on preflight or when the
		// origin is not allowed; seeing undefined here confirms we didn’t
		// short‑circuit and behaved like normal middleware.
		expect(res).toBeUndefined();
	});

	it("returns a preflight response with CORS headers when OPTIONS and allowed", async () => {
		const origin = "https://allowed-preflight.com";
		const headerSpy2 = vi.fn();
		const ctx = makeCtx({
			headers: { Origin: origin },
			env: { ENVIRONMENT: "production", ALLOWED_ORIGINS: origin },
			header: headerSpy2,
			req: { method: "OPTIONS" },
		});

		const resp = await corsMiddleware(ctx, () => Promise.resolve());

		expect(resp).toBeInstanceOf(Response);
		expect(resp?.status).toBe(HTTP_NO_CONTENT);
		expect(resp?.headers.get("Access-Control-Allow-Origin")).toBe(origin);
		expect(resp?.headers.get("Access-Control-Max-Age")).toBe(String(ACCESS_CONTROL_MAX_AGE_SEC));
	});

	it("returns 204 without CORS headers when OPTIONS and origin not allowed", async () => {
		const ctx = makeCtx({
			headers: { Origin: "https://bad.com" },
			env: { ENVIRONMENT: "production", ALLOWED_ORIGINS: "https://good.com" },
			req: { method: "OPTIONS" },
		});

		const loggerMod = await import("@/api/logger");
		const warn = vi.spyOn(loggerMod, "warn").mockImplementation(() => undefined);
		const resp = await corsMiddleware(ctx, () => Promise.resolve());

		expect(warn).toHaveBeenCalledTimes(ONE);
		expect(resp?.status).toBe(HTTP_NO_CONTENT);
		expect(resp?.headers.get("Access-Control-Allow-Origin")).toBeNull();
		warn.mockRestore();
	});

	it("allows any truthy Origin header in non-production (dev) mode", async () => {
		const headerSpy = vi.fn();
		const ctx = makeCtx({
			headers: { Origin: "https://dev-origin.test" },
			env: { ENVIRONMENT: "development" },
			header: headerSpy,
			req: { method: "GET" },
		});

		await corsMiddleware(ctx, () => Promise.resolve());

		expect(headerSpy).toHaveBeenCalledWith(
			"Access-Control-Allow-Origin",
			"https://dev-origin.test",
		);
	});
});
