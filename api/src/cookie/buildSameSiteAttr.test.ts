import { describe, expect, it } from "vitest";

import buildSameSiteAttr from "./buildSameSiteAttr";

describe("buildSameSiteAttr", () => {
	it("returns SameSite=None for localhost redirect in non-prod", () => {
		expect(
			buildSameSiteAttr({
				isProd: false,
				redirectOrigin: "http://localhost:3000",
				secureFlag: false,
			}),
		).toBe("SameSite=None;");
	});

	it("returns SameSite=None for 127.0.0.1 redirect in non-prod", () => {
		expect(
			buildSameSiteAttr({
				isProd: false,
				redirectOrigin: "http://127.0.0.1:5173",
				secureFlag: false,
			}),
		).toBe("SameSite=None;");
	});

	it("returns SameSite=None when secureFlag is true regardless of redirectOrigin", () => {
		expect(buildSameSiteAttr({ isProd: false, redirectOrigin: "", secureFlag: true })).toBe(
			"SameSite=None;",
		);
		expect(
			buildSameSiteAttr({ isProd: true, redirectOrigin: "https://example.com", secureFlag: true }),
		).toBe("SameSite=None;");
	});

	it("returns SameSite=Lax in non-secure, non-localhost contexts", () => {
		expect(
			buildSameSiteAttr({
				isProd: false,
				redirectOrigin: "https://example.com",
				secureFlag: false,
			}),
		).toBe("SameSite=Lax;");
	});

	it("does not treat localhost redirect as dev-only when isProd is true (returns Lax)", () => {
		expect(
			buildSameSiteAttr({
				isProd: true,
				redirectOrigin: "http://localhost:3000",
				secureFlag: false,
			}),
		).toBe("SameSite=Lax;");
	});
});
