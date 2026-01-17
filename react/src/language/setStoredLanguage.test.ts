/* oxlint-disable unicorn/no-null */
import { describe, expect, it, vi } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";

import setStoredLanguage from "./setStoredLanguage";

describe("setStoredLanguage", () => {
	function setup(): void {
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
	}

	it("sets localStorage and document.cookie", () => {
		setup();
		const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
		setStoredLanguage("zh");

		expect(setItemSpy).toHaveBeenCalledWith("preferred-language", "zh");
		expect(document.cookie).toContain(`${preferredLanguageCookieName}=zh`);
		expect(document.cookie).toContain("path=/");
		expect(document.cookie).toContain("SameSite=Lax");
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("sets Secure flag on https", () => {
		setup();
		vi.stubGlobal("location", {
			protocol: "https:",
		});

		setStoredLanguage("es");

		expect(document.cookie).toContain("Secure");
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("includes expiry date", () => {
		setup();
		setStoredLanguage("en");

		expect(document.cookie).toContain("expires=");
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
});
