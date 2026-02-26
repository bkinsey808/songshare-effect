import { describe, expect, it } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";

import buildSetCookieHeader from "./buildSetCookieHeader";

describe("buildSetCookieHeader", () => {
	it("returns default header with HttpOnly, SameSite=None, Max-Age and Secure when request is https", () => {
		const ctx = makeCtx();

		const hdr = buildSetCookieHeader({ ctx, name: "session", value: "val" });

		expect(hdr).toContain("session=val;");
		expect(hdr).toContain("HttpOnly;");
		expect(hdr).toContain("SameSite=None;");
		expect(hdr).toContain("Max-Age=604800;");
		expect(hdr).toContain("Secure;");
	});

	it("respects provided maxAge and omits Expires when non-zero", () => {
		const ctx = makeCtx();

		const hdr = buildSetCookieHeader({ ctx, name: "a", value: "b", opts: { maxAge: 3600 } });

		expect(hdr).toContain("Max-Age=3600;");
		expect(hdr).not.toContain("Expires=");
	});

	it("adds Expires and Max-Age=0 when maxAge is ZERO", () => {
		const ctx = makeCtx();

		const hdr = buildSetCookieHeader({ ctx, name: "dead", value: "", opts: { maxAge: 0 } });

		expect(hdr).toContain("Max-Age=0;");
		expect(hdr).toMatch(/Expires=.*;\s/);
	});

	it("omits HttpOnly when opts.httpOnly is false", () => {
		const ctx = makeCtx();

		const hdr = buildSetCookieHeader({
			ctx,
			name: "nohttponly",
			value: "v",
			opts: { httpOnly: false },
		});

		expect(hdr).not.toContain("HttpOnly;");
		expect(hdr).toContain("Path=/;");
	});

	it("does not set request proto as https when overriding url via a typed cast", () => {
		const ctx = makeCtx({ req: { url: "http://example.test/api/test" } });

		const hdr = buildSetCookieHeader({ ctx, name: "insecure2", value: "1" });

		expect(hdr).not.toContain("Secure;");
		expect(hdr).toContain("SameSite=Lax;");
	});

	it("treats redirect origin starting with https:// as secure (adds Secure and SameSite=None)", () => {
		const ctx = makeCtx({ env: { OAUTH_REDIRECT_ORIGIN: "https://app.example" } });

		const hdr = buildSetCookieHeader({ ctx, name: "redir", value: "x" });

		expect(hdr).toContain("Secure;");
		expect(hdr).toContain("SameSite=None;");
	});

	it("marks cookie Secure when x-forwarded-proto header is https", () => {
		const ctx = makeCtx({ headers: { "x-forwarded-proto": "https" } });
		const hdr = buildSetCookieHeader({ ctx, name: "fp", value: "1" });
		expect(hdr).toContain("Secure;");
		expect(hdr).toContain("SameSite=None;");
	});

	it("marks cookie Secure and SameSite=None when ENVIRONMENT is production", () => {
		const ctx = makeCtx({ env: { ENVIRONMENT: "production" } });
		const hdr = buildSetCookieHeader({ ctx, name: "prod", value: "1" });
		expect(hdr).toContain("Secure;");
		expect(hdr).toContain("SameSite=None;");
	});
});
