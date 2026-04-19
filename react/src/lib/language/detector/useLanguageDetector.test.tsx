import { renderHook } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import detectBrowserLanguage from "@/shared/language/detectBrowserLanguage";

import getStoredLanguage from "../stored/getStoredLanguage";
import useLanguageDetector from "./useLanguageDetector";

/**
 * Replace the runtime browser-language detector with a typed mock.
 *
 * Keeps the typed mock setup localized so the rest of the test file stays
 * free of inline disables and loose mock typing.
 *
 * @param lang - The language value the detector should return
 * @returns void
 */
function mockDetectBrowserLanguage(lang: ReturnType<typeof detectBrowserLanguage>): void {
	const mocked = vi.mocked(detectBrowserLanguage);
	mocked.mockImplementation(() => lang);
}

vi.mock("react-router-dom");
vi.mock("@/shared/language/detectBrowserLanguage");
vi.mock("../stored/getStoredLanguage");

describe("useLanguageDetector", () => {
	const mockNavigate = vi.fn();

	/**
	 * Prepare global stubs and return a cleanup function for the test.
	 *
	 * @returns Cleanup function that restores mocks and globals
	 */
	function setup(): () => void {
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.stubGlobal("navigator", { language: "en-US" });
		return () => {
			vi.clearAllMocks();
			vi.unstubAllGlobals();
		};
	}

	it("redirects to stored language if available", async () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockResolvedValue("zh");
		mockDetectBrowserLanguage("en");

		renderHook(() => {
			useLanguageDetector();
		});

		// wait for microtasks
		await Promise.resolve();
		expect(mockNavigate).toHaveBeenCalledWith("/zh/", { replace: true });
		cleanup();
	});

	it("redirects to detected browser language if no stored preference", async () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockResolvedValue(undefined);
		mockDetectBrowserLanguage("es");

		renderHook(() => {
			useLanguageDetector();
		});

		await Promise.resolve();
		expect(mockNavigate).toHaveBeenCalledWith("/es/", { replace: true });
		cleanup();
	});

	it("passes navigator.language to detectBrowserLanguage", async () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockResolvedValue(undefined);
		mockDetectBrowserLanguage("en");

		renderHook(() => {
			useLanguageDetector();
		});

		await Promise.resolve();
		expect(detectBrowserLanguage).toHaveBeenCalledWith("en-US");
		cleanup();
	});
});
