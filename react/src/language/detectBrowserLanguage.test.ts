/* oxlint-disable unicorn/no-null */
import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import detectBrowserLanguage from "./detectBrowserLanguage";

describe("detectBrowserLanguage", () => {
	it("returns defaultLanguage when acceptLanguage is undefined", () => {
		expect(detectBrowserLanguage(undefined)).toBe(defaultLanguage);
	});

	it("returns defaultLanguage when acceptLanguage is null", () => {
		// @ts-expect-error - testing invalid input
		expect(detectBrowserLanguage(null)).toBe(defaultLanguage);
	});

	it("returns defaultLanguage when acceptLanguage is empty", () => {
		expect(detectBrowserLanguage("")).toBe(defaultLanguage);
	});

	it("returns defaultLanguage when no supported language is found", () => {
		expect(detectBrowserLanguage("fr,de")).toBe(defaultLanguage);
	});

	it("detects 'en' from 'en-US,en;q=0.9'", () => {
		expect(detectBrowserLanguage("en-US,en;q=0.9")).toBe("en");
	});

	it("detects 'zh' from 'zh-CN,zh;q=0.9,en;q=0.8'", () => {
		expect(detectBrowserLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
	});

	it("detects 'es' from 'es;q=0.9,en;q=0.8'", () => {
		expect(detectBrowserLanguage("es;q=0.9,en;q=0.8")).toBe("es");
	});

	it("handles malformed acceptLanguage string", () => {
		expect(detectBrowserLanguage(",,,;")).toBe(defaultLanguage);
	});
});
