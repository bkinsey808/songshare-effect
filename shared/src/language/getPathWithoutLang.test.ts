import { describe, expect, it } from "vitest";

import getPathWithoutLang from "./getPathWithoutLang";

describe("getPathWithoutLang", () => {
	it("returns / for root and empty pathname", () => {
		expect(getPathWithoutLang("/")).toBe("/");
		expect(getPathWithoutLang("")).toBe("/");
	});

	it("removes supported language segment (en, es, zh)", () => {
		expect(getPathWithoutLang("/en")).toBe("/");
		expect(getPathWithoutLang("/en/")).toBe("/");
		expect(getPathWithoutLang("/en/foo")).toBe("/foo");
		expect(getPathWithoutLang("/es/dashboard")).toBe("/dashboard");
		expect(getPathWithoutLang("/zh/settings")).toBe("/settings");
	});

	it("preserves paths without a supported language prefix", () => {
		expect(getPathWithoutLang("/foo")).toBe("/foo");
		expect(getPathWithoutLang("/zz/foo")).toBe("/zz/foo");
		expect(getPathWithoutLang("/unknown/path")).toBe("/unknown/path");
	});

	it("ensures leading slash when pathname has no leading slash", () => {
		expect(getPathWithoutLang("foo")).toBe("/foo");
	});
});
