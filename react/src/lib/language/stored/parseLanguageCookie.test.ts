/* oxlint-disable unicorn/no-null */
import { describe, expect, it } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";

import parseLanguageCookie from "./parseLanguageCookie";

describe("parseLanguageCookie", () => {
	it("returns undefined when cookieHeader is undefined", () => {
		// @ts-expect-error - testing invalid input
		expect(parseLanguageCookie(undefined)).toBeUndefined();
	});

	it("returns undefined when cookieHeader is null", () => {
		expect(parseLanguageCookie(null)).toBeUndefined();
	});

	it("returns undefined when cookieHeader is empty", () => {
		expect(parseLanguageCookie("")).toBeUndefined();
	});

	it("returns undefined when cookie name is not present", () => {
		expect(parseLanguageCookie("foo=bar; baz=qux")).toBeUndefined();
	});

	it("detects 'en' when present", () => {
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=en`)).toBe("en");
	});

	it("detects 'zh' when present among other cookies", () => {
		const cookie = `foo=bar; ${preferredLanguageCookieName}=zh; baz=qux`;
		expect(parseLanguageCookie(cookie)).toBe("zh");
	});

	it("returns undefined for unsupported language in cookie", () => {
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=fr`)).toBeUndefined();
	});

	it("handles extra whitespace in cookie header", () => {
		const cookie = `  some-other-cookie=val; ${preferredLanguageCookieName}=es  `;
		expect(parseLanguageCookie(cookie)).toBe("es");
	});
});
