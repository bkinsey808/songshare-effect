/* oxlint-disable unicorn/no-null */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";

import getStoredLanguage from "./getStoredLanguage";

describe("getStoredLanguage", () => {
	beforeEach(() => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
		vi.stubGlobal("document", {
			cookie: "",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns undefined when nothing is stored", () => {
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
		expect(getStoredLanguage()).toBeUndefined();
	});

	it("returns language from localStorage if valid", () => {
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		expect(getStoredLanguage()).toBe("zh");
	});

	it("returns undefined if localStorage has invalid language", () => {
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("fr");
		expect(getStoredLanguage()).toBeUndefined();
	});

	it("returns language from cookie if localStorage is empty", () => {
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
		vi.stubGlobal("document", {
			cookie: `${preferredLanguageCookieName}=es`,
		});

		expect(getStoredLanguage()).toBe("es");
	});

	it("prefers localStorage over cookie", () => {
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		vi.stubGlobal("document", {
			cookie: `${preferredLanguageCookieName}=es`,
		});

		expect(getStoredLanguage()).toBe("zh");
	});
});
