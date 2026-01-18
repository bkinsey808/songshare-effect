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

	it("sets localStorage and document.cookie", async () => {
		setup();
		const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
		await setStoredLanguage("zh");

		expect(setItemSpy).toHaveBeenCalledWith("preferred-language", "zh");
		expect(document.cookie).toContain(`${preferredLanguageCookieName}=zh`);
		expect(document.cookie).toContain("path=/");
		expect(document.cookie).toContain("SameSite=Lax");
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("sets Secure flag on https", async () => {
		setup();
		vi.stubGlobal("location", {
			protocol: "https:",
		});

		await setStoredLanguage("es");

		expect(document.cookie).toContain("Secure");
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("uses Cookie Store API when available", async () => {
		setup();
		const setSpy = vi.fn();
		setSpy.mockResolvedValue(undefined);
		vi.stubGlobal("cookieStore", { set: setSpy });

		await setStoredLanguage("zh");

		expect(setSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				name: preferredLanguageCookieName,
				value: "zh",
				path: "/",
				sameSite: "lax",
			}),
		);

		// Ensure fallback did not also write to document.cookie
		expect(document.cookie).not.toContain(`${preferredLanguageCookieName}=zh`);

		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("includes expiry date", async () => {
		setup();
		await setStoredLanguage("en");

		expect(document.cookie).toContain("expires=");
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
});
