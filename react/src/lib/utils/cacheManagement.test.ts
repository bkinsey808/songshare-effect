import { describe, expect, it, vi } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import { checkAppVersion, clearAppCache, checkForUpdates } from "./cacheManagement";

const VERSION_KEY = "app_version";
const AUTH_TOKENS_KEY = "auth_tokens";
const AUTH_TOKENS_VALUE = "token-xyz";
const CURRENT_VERSION = "1.0.0";
const STORED_VERSION_OLD = "0.9.0";
const MANIFEST_VERSION_KEY = "app_manifest_version";

describe("cacheManagement", () => {
	describe("checkAppVersion", () => {
		it("does not clear cache when stored version matches current", () => {
			const mockLocalStorage = {
				getItem: vi.fn().mockReturnValue(CURRENT_VERSION),
				setItem: vi.fn(),
				clear: vi.fn(),
			};
			vi.stubGlobal("localStorage", mockLocalStorage);
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

			checkAppVersion();

			expect(mockLocalStorage.clear).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			warnSpy.mockRestore();
			vi.unstubAllGlobals();
		});

		it("clears cache and sets version when stored version differs", () => {
			const mockLocalStorage = {
				getItem: vi.fn().mockReturnValue(STORED_VERSION_OLD),
				setItem: vi.fn(),
				clear: vi.fn(),
			};
			vi.stubGlobal("localStorage", mockLocalStorage);
			vi.stubGlobal("sessionStorage", { clear: vi.fn() });
			vi.stubGlobal("caches", undefined);
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

			checkAppVersion();

			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(STORED_VERSION_OLD));
			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(VERSION_KEY, CURRENT_VERSION);
			warnSpy.mockRestore();
			vi.unstubAllGlobals();
		});
	});

	describe("clearAppCache", () => {
		it("preserves auth_tokens when clearing localStorage", async () => {
			const storage: Record<string, string> = {
				[VERSION_KEY]: CURRENT_VERSION,
				[AUTH_TOKENS_KEY]: AUTH_TOKENS_VALUE,
			};
			const mockLocalStorage = {
				getItem: vi.fn((key: string) => storage[key]),
				setItem: vi.fn((key: string, value: string) => {
					storage[key] = value;
				}),
				clear: vi.fn(() => {
					for (const key of Object.keys(storage)) {
						Reflect.deleteProperty(storage, key);
					}
				}),
			};
			vi.stubGlobal("localStorage", mockLocalStorage);
			vi.stubGlobal("sessionStorage", { clear: vi.fn() });
			vi.stubGlobal("caches", undefined);

			await clearAppCache();

			expect(mockLocalStorage.clear).toHaveBeenCalledWith();
			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(AUTH_TOKENS_KEY, AUTH_TOKENS_VALUE);
			vi.unstubAllGlobals();
		});

		it("does not set auth_tokens when none stored", async () => {
			const mockLocalStorage = {
				getItem: vi.fn().mockReturnValue(makeNull()),
				setItem: vi.fn(),
				clear: vi.fn(),
			};
			vi.stubGlobal("localStorage", mockLocalStorage);
			vi.stubGlobal("sessionStorage", { clear: vi.fn() });
			vi.stubGlobal("caches", undefined);

			await clearAppCache();

			const setItemCalls = mockLocalStorage.setItem.mock.calls;
			const FIRST_ARG = 0;
			const hasAuthTokensCall = setItemCalls.some(
				(call: unknown[]) => call[FIRST_ARG] === AUTH_TOKENS_KEY,
			);
			expect(hasAuthTokensCall).toBe(false);
			vi.unstubAllGlobals();
		});
	});

	describe("checkForUpdates", () => {
		it("returns false when fetch fails", async () => {
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
			const result = await checkForUpdates();
			expect(result).toBe(false);
			vi.unstubAllGlobals();
		});

		it("returns false when manifest has no version and stored already matches", async () => {
			const unknownVersion = "unknown";
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					json: async () => {
						await Promise.resolve();
						return {};
					},
				}),
			);
			const mockLocalStorage = {
				getItem: vi.fn().mockReturnValue(unknownVersion),
				setItem: vi.fn(),
			};
			vi.stubGlobal("localStorage", mockLocalStorage);
			const result = await checkForUpdates();
			expect(result).toBe(false);
			vi.unstubAllGlobals();
		});

		it("returns true when stored version differs from manifest version", async () => {
			const manifestVersion = "2.0.0";
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					json: async () => {
						await Promise.resolve();
						return { version: manifestVersion };
					},
				}),
			);
			const mockLocalStorage = {
				getItem: vi.fn().mockReturnValue(STORED_VERSION_OLD),
				setItem: vi.fn(),
			};
			vi.stubGlobal("localStorage", mockLocalStorage);
			const result = await checkForUpdates();
			expect(result).toBe(true);
			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(MANIFEST_VERSION_KEY, manifestVersion);
			vi.unstubAllGlobals();
		});
	});
});
