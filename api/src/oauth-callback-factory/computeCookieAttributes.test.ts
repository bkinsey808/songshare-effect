import { describe, expect, it } from "vitest";

import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

import computeCookieAttributes, { type CookieAttrs } from "./computeCookieAttributes";

// minimal fake context covering only the properties used by the helper
// we cast into ReadonlyContext inside the factory helper

function makeCtx(
	env: Record<string, string>,
	url = "http://localhost/whatever",
	headHeader = "",
): ReadonlyContext {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-explicit-any
	return {
		env,
		req: { header: () => headHeader, url },
	} as unknown as ReadonlyContext;
}

describe("computeCookieAttributes", () => {
	it("returns non-secure Lax settings for plain http dev", () => {
		const ctx = makeCtx({});
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		expect(attrs.domainAttr).toBe("");
		expect(attrs.secureString).toBe("");
		expect(attrs.sameSiteAttr).toBe("SameSite=Lax;");
	});

	it("sets Secure when environment is production", () => {
		const ctx = makeCtx({ ENVIRONMENT: "production" }, "https://app.test");
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		expect(attrs.secureString).toBe("Secure;");
		expect(attrs.sameSiteAttr).toBe("SameSite=None;");
	});

	it("honors forwarded proto header even in non-prod", () => {
		const ctx = makeCtx({}, "http://foo", "https");
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		expect(attrs.secureString).toBe("Secure;");
	});

	it("prefers None when redirect origin contains localhost dev string", () => {
		const ctx = makeCtx({ OAUTH_REDIRECT_ORIGIN: "https://localhost:3000" });
		const attrs: CookieAttrs = computeCookieAttributes(ctx);
		// secureFlag is false in this scenario, but SameSite should still be None
		expect(attrs.sameSiteAttr).toBe("SameSite=None;");
	});
});
