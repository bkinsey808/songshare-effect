import { describe, expect, it } from "vitest";

import buildSameSiteAttr from "./buildSameSiteAttr";

describe("buildSameSiteAttr", () => {
	it.each([
		["SameSite=None;", { isProd: false, redirectOrigin: "https://localhost:5173", secureFlag: false }],
		["SameSite=None;", { isProd: false, redirectOrigin: "https://127.0.0.1:5173", secureFlag: false }],
		["SameSite=None;", { isProd: true, redirectOrigin: "https://example.com", secureFlag: true }],
		["SameSite=Lax;", { isProd: true, redirectOrigin: "https://example.com", secureFlag: false }],
		["SameSite=Lax;", { isProd: false, redirectOrigin: "https://example.com", secureFlag: false }],
	] as const)("returns %s for given params", (expected, params) => {
		expect(buildSameSiteAttr(params)).toBe(expected);
	});
});
