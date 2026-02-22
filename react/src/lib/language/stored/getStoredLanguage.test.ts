import { describe, expect, it, vi } from "vitest";

import { preferredLanguageCookieName } from "@/shared/cookies";

import getStoredLanguage from "./getStoredLanguage";
import { missingLanguage } from "./test-utils";

describe("getStoredLanguage", () => {
	function setup(): () => void {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => missingLanguage);
		vi.stubGlobal("document", { cookie: "" });
		return () => {
			vi.restoreAllMocks();
			vi.unstubAllGlobals();
		};
	}

	it("returns undefined when nothing is stored", async () => {
		const cleanup = setup();
		// storage.getItem returns string|null; return `null` to simulate missing value
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(missingLanguage);
		await expect(getStoredLanguage()).resolves.toBeUndefined();
		cleanup();
	});

	it("uses Cookie Store API when available (async)", async () => {
		const cleanup = setup();
		const cookie = { value: "es" } as const;
		const getSpy = vi.fn(() => cookie);
		vi.stubGlobal("cookieStore", { get: getSpy });

		const val = await getStoredLanguage();
		expect(getSpy).toHaveBeenCalledWith(preferredLanguageCookieName);
		expect(val).toBe("es");
		cleanup();
	});

	it("falls back to sync path when Cookie Store yields nothing", async () => {
		const cleanup = setup();
		vi.stubGlobal("cookieStore", { get: vi.fn(() => undefined) });
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");

		const val = await getStoredLanguage();
		expect(val).toBe("zh");
		cleanup();
	});

	it("returns language from localStorage if valid", async () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		await expect(getStoredLanguage()).resolves.toBe("zh");
		cleanup();
	});

	it("returns undefined if localStorage has invalid language", async () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("fr");
		await expect(getStoredLanguage()).resolves.toBeUndefined();
		cleanup();
	});

	it("returns language from cookie if localStorage is empty", async () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue(missingLanguage);
		vi.stubGlobal("document", {
			cookie: `${preferredLanguageCookieName}=es`,
		});

		await expect(getStoredLanguage()).resolves.toBe("es");
		cleanup();
	});

	it("prefers localStorage over cookie", async () => {
		const cleanup = setup();
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("zh");
		vi.stubGlobal("document", {
			cookie: `${preferredLanguageCookieName}=es`,
		});

		await expect(getStoredLanguage()).resolves.toBe("zh");
		cleanup();
	});
});
