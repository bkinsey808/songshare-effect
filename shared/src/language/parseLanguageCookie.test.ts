import { describe, expect, it } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import parseLanguageCookie from "./parseLanguageCookie";

describe("parseLanguageCookie", () => {
	it("returns undefined for null and empty header", () => {
		// Assert
		expect(parseLanguageCookie(makeNull())).toBeUndefined();
		expect(parseLanguageCookie("")).toBeUndefined();
		expect(parseLanguageCookie("   ")).toBeUndefined();
	});

	it("returns undefined when cookie name is not present", () => {
		// Assert
		expect(parseLanguageCookie("foo=bar; baz=qux")).toBeUndefined();
	});

	it("returns supported language when present", () => {
		// Assert
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=en`)).toBe("en");
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=es`)).toBe("es");
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=zh`)).toBe("zh");
	});

	it("returns language when present among other cookies", () => {
		// Act
		const cookie = `foo=bar; ${preferredLanguageCookieName}=zh; baz=qux`;
		// Assert
		expect(parseLanguageCookie(cookie)).toBe("zh");
	});

	it("returns undefined for unsupported language", () => {
		// Assert
		expect(parseLanguageCookie(`${preferredLanguageCookieName}=fr`)).toBeUndefined();
	});

	it("trims whitespace from cookie value", () => {
		// Act
		const cookie = `  other=val; ${preferredLanguageCookieName}=es  `;
		// Assert
		expect(parseLanguageCookie(cookie)).toBe("es");
	});
});
