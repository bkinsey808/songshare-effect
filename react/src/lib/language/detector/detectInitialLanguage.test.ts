import { describe, expect, it, vi } from "vitest";

import detectBrowserLanguage from "@/shared/language/detectBrowserLanguage";
import parseLanguageCookie from "@/shared/language/parseLanguageCookie";
import { defaultLanguage } from "@/shared/language/supported-languages";

import detectInitialLanguage from "./detectInitialLanguage";

vi.mock("@/shared/language/detectBrowserLanguage");
vi.mock("@/shared/language/parseLanguageCookie");

const mockDetectBrowserLanguage = vi.mocked(detectBrowserLanguage);
const mockParseLanguageCookie = vi.mocked(parseLanguageCookie);

/**
 * Ensure each test starts with a clean, predictable global environment.
 * Returns a cleanup function that must be called at the end of the test.
 */
function setup(): () => void {
	// default to an innocuous pathname
	vi.stubGlobal("location", { pathname: "/" });
	// no stored preference by default; jsdom's Storage returns null already
	vi.stubGlobal("document", { cookie: "" });
	// stub external helpers to safe defaults
	mockDetectBrowserLanguage.mockReturnValue(defaultLanguage);
	mockParseLanguageCookie.mockReturnValue(undefined);

	return () => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		mockDetectBrowserLanguage.mockReset();
		mockParseLanguageCookie.mockReset();
	};
}

describe("detectInitialLanguage", () => {
	it("uses the language in the URL path when it's a supported code", () => {
		const cleanup = setup();
		vi.stubGlobal("location", { pathname: "/es/some/page" });
		// provide other values just to prove the priority order
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		mockParseLanguageCookie.mockReturnValue("en");
		mockDetectBrowserLanguage.mockReturnValue("en");

		expect(detectInitialLanguage()).toBe("es");
		cleanup();
	});

	it("falls through when the path language is unsupported or missing", () => {
		const cleanup = setup();
		// two variations: unsupported code and missing trailing slash
		vi.stubGlobal("location", { pathname: "/fr/hello" });
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("es");
		expect(detectInitialLanguage()).toBe("es");

		vi.stubGlobal("location", { pathname: "/en" });
		// should still return stored value
		expect(detectInitialLanguage()).toBe("es");
		cleanup();
	});

	it("ignores uppercase path segments", () => {
		const cleanup = setup();
		vi.stubGlobal("location", { pathname: "/EN/" });
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		expect(detectInitialLanguage()).toBe("zh");
		cleanup();
	});

	it("uses localStorage when path does not yield a language", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		expect(detectInitialLanguage()).toBe("zh");
		cleanup();
	});

	it("skips empty/invalid localStorage values and tries cookie next", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("");
		mockParseLanguageCookie.mockReturnValue("es");
		expect(detectInitialLanguage()).toBe("es");
		cleanup();
	});

	it("honours cookie result when no path or stored preference present", () => {
		const cleanup = setup();
		mockParseLanguageCookie.mockReturnValue("zh");
		expect(detectInitialLanguage()).toBe("zh");
		cleanup();
	});

	it("falls back to browser detection when nothing else matches", () => {
		const cleanup = setup();
		mockDetectBrowserLanguage.mockReturnValue("es");
		expect(detectInitialLanguage()).toBe("es");
		cleanup();
	});

	it("uses defaultLanguage when navigator is unavailable", () => {
		const cleanup = setup();
		// make sure even the browser helper isn't called
		mockDetectBrowserLanguage.mockReturnValue("zh");
		vi.stubGlobal("navigator", undefined);

		expect(detectInitialLanguage()).toBe(defaultLanguage);
		cleanup();
	});
});
