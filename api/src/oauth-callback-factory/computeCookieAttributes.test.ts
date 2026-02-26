import { describe, expect, it } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";

import computeCookieAttributes, { type CookieAttrs } from "./computeCookieAttributes";

describe("computeCookieAttributes", () => {
	it("returns non-secure Lax settings for plain http dev", () => {
		const ctx = makeCtx({ req: { url: "http://localhost/whatever" } });
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		expect(attrs.domainAttr).toBe("");
		expect(attrs.secureString).toBe("");
		expect(attrs.sameSiteAttr).toBe("SameSite=Lax;");
	});

	it("sets Secure when environment is production", () => {
		const ctx = makeCtx({
			env: { ENVIRONMENT: "production" },
			req: { url: "https://app.test" },
		});
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		expect(attrs.secureString).toBe("Secure;");
		expect(attrs.sameSiteAttr).toBe("SameSite=None;");
	});

	it("honors forwarded proto header even in non-prod", () => {
		const ctx = makeCtx({
			req: { url: "http://foo" },
			headers: { "x-forwarded-proto": "https" },
		});
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		expect(attrs.secureString).toBe("Secure;");
	});

	it("prefers None when redirect origin contains localhost dev string", () => {
		const ctx = makeCtx({ env: { OAUTH_REDIRECT_ORIGIN: "https://localhost:3000" } });
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		// secureFlag is false in this scenario, but SameSite should still be None
		expect(attrs.sameSiteAttr).toBe("SameSite=None;");
	});
});
