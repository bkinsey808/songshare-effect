import { renderHook } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import detectBrowserLanguage from "./detectBrowserLanguage";
import getStoredLanguage from "./getStoredLanguage";
import useLanguageDetector from "./useLanguageDetector";

vi.mock("react-router-dom");
vi.mock("./detectBrowserLanguage");
vi.mock("./getStoredLanguage");

describe("useLanguageDetector", () => {
	const mockNavigate = vi.fn();

	function setup(): () => void {
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.stubGlobal("navigator", { language: "en-US" });
		return () => {
			vi.clearAllMocks();
			vi.unstubAllGlobals();
		};
	}

	it("redirects to stored language if available", () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockReturnValue("zh");
		vi.mocked(detectBrowserLanguage).mockReturnValue("en");

		renderHook(() => {
			useLanguageDetector();
		});

		expect(mockNavigate).toHaveBeenCalledWith("/zh/", { replace: true });
		cleanup();
	});

	it("redirects to detected browser language if no stored preference", () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockReturnValue(undefined);
		vi.mocked(detectBrowserLanguage).mockReturnValue("es");

		renderHook(() => {
			useLanguageDetector();
		});

		expect(mockNavigate).toHaveBeenCalledWith("/es/", { replace: true });
		cleanup();
	});

	it("passes navigator.language to detectBrowserLanguage", () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockReturnValue(undefined);
		vi.mocked(detectBrowserLanguage).mockReturnValue("en");

		renderHook(() => {
			useLanguageDetector();
		});

		expect(detectBrowserLanguage).toHaveBeenCalledWith("en-US");
		cleanup();
	});
});
