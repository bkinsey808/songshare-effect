import { describe, expect, it } from "vitest";

import getPathWithoutLang from "./getPathWithoutLang";

describe("getPathWithoutLang", () => {
	it("returns / for root paths", () => {
		expect(getPathWithoutLang("/")).toBe("/");
		expect(getPathWithoutLang("")).toBe("/");
	});

	it("removes supported language segment", () => {
		expect(getPathWithoutLang("/en")).toBe("/");
		expect(getPathWithoutLang("/en/")).toBe("/");
		expect(getPathWithoutLang("/en/foo/bar")).toBe("/foo/bar");
	});

	it("preserves paths without a supported language prefix", () => {
		expect(getPathWithoutLang("/foo")).toBe("/foo");
		expect(getPathWithoutLang("/zz/foo")).toBe("/zz/foo");
	});
});
