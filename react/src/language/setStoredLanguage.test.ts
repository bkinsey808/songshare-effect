/* oxlint-disable unicorn/no-null */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";

import setStoredLanguage from "./setStoredLanguage";

describe("setStoredLanguage", () => {
	beforeEach(() => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			/* no-op */
		});
		vi.stubGlobal("location", {
			protocol: "http:",
		});
		let cookieValue = "";
		vi.stubGlobal("document", {
			get cookie() {
				return cookieValue;
			},
			set cookie(value: string) {
				cookieValue = value;
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("sets localStorage and document.cookie", () => {
		const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
		setStoredLanguage("zh");

		expect(setItemSpy).toHaveBeenCalledWith("preferred-language", "zh");
		expect(document.cookie).toContain(`${preferredLanguageCookieName}=zh`);
		expect(document.cookie).toContain("path=/");
		expect(document.cookie).toContain("SameSite=Lax");
	});

	it("sets Secure flag on https", () => {
		vi.stubGlobal("location", {
			protocol: "https:",
		});

		setStoredLanguage("es");

		expect(document.cookie).toContain("Secure");
	});

	it("includes expiry date", () => {
		setStoredLanguage("en");

		expect(document.cookie).toContain("expires=");
	});
});
