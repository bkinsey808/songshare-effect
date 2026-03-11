import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";
import { preferredLanguageCookieName } from "@/shared/cookies";

import parseLanguageCookie from "./parseLanguageCookie";

describe("parseLanguageCookie", () => {
	it("returns undefined for null and empty header", () => {
		expect(parseLanguageCookie(makeNull())).toBeUndefined();
		expect(parseLanguageCookie("")).toBeUndefined();
		expect(parseLanguageCookie("   ")).toBeUndefined();
	});

	it("returns undefined when cookie name is not present", () => {
		expect(parseLanguageCookie("foo=bar; baz=qux")).toBeUndefined();
	});

	it("returns supported language when present", () => {
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=en`)).toBe("en");
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=es`)).toBe("es");
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=zh`)).toBe("zh");
	});

	it("returns language when present among other cookies", () => {
		const cookie = `foo=bar; ${preferredLanguageCookieName}=zh; baz=qux`;
		expect(parseLanguageCookie(cookie)).toBe("zh");
	});

	it("returns undefined for unsupported language", () => {
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=fr`)).toBeUndefined();
	});

	it("trims whitespace from cookie value", () => {
		const cookie = `  other=val; ${preferredLanguageCookieName}=es  `;
		expect(parseLanguageCookie(cookie)).toBe("es");
	});
});
