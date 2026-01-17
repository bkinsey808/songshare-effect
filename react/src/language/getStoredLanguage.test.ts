/* oxlint-disable unicorn/no-null */
import { describe, expect, it, vi } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";

import getStoredLanguage from "./getStoredLanguage";

describe("getStoredLanguage", () => {
	function setup(): () => void {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
		vi.stubGlobal("document", { cookie: "" });
		return () => {
			vi.restoreAllMocks();
			vi.unstubAllGlobals();
		};
	}

	it("returns undefined when nothing is stored", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
		expect(getStoredLanguage()).toBeUndefined();
		cleanup();
	});

	it("returns language from localStorage if valid", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		expect(getStoredLanguage()).toBe("zh");
		cleanup();
	});

	it("returns undefined if localStorage has invalid language", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("fr");
		expect(getStoredLanguage()).toBeUndefined();
		cleanup();
	});

	it("returns language from cookie if localStorage is empty", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
		vi.stubGlobal("document", {
			cookie: `${preferredLanguageCookieName}=es`,
		});

		expect(getStoredLanguage()).toBe("es");
		cleanup();
	});

	it("prefers localStorage over cookie", () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		vi.stubGlobal("document", {
			cookie: `${preferredLanguageCookieName}=es`,
		});

		expect(getStoredLanguage()).toBe("zh");
		cleanup();
	});
});
