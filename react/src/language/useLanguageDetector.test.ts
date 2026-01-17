import { renderHook } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import detectBrowserLanguage from "./detectBrowserLanguage";
import getStoredLanguage from "./getStoredLanguage";
import useLanguageDetector from "./useLanguageDetector";

vi.mock("react-router-dom", () => ({
	useNavigate: vi.fn(),
}));

vi.mock("./detectBrowserLanguage", () => ({
	default: vi.fn(),
}));

vi.mock("./getStoredLanguage", () => ({
	default: vi.fn(),
}));

describe("useLanguageDetector", () => {
	const mockNavigate = vi.fn();

	beforeEach(() => {
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.stubGlobal("navigator", {
			language: "en-US",
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
	});

	it("redirects to stored language if available", () => {
		vi.mocked(getStoredLanguage).mockReturnValue("zh");
		vi.mocked(detectBrowserLanguage).mockReturnValue("en");

		renderHook(() => {
			useLanguageDetector();
		});

		expect(mockNavigate).toHaveBeenCalledWith("/zh/", { replace: true });
	});

	it("redirects to detected browser language if no stored preference", () => {
		vi.mocked(getStoredLanguage).mockReturnValue(undefined);
		vi.mocked(detectBrowserLanguage).mockReturnValue("es");

		renderHook(() => {
			useLanguageDetector();
		});

		expect(mockNavigate).toHaveBeenCalledWith("/es/", { replace: true });
	});

	it("passes navigator.language to detectBrowserLanguage", () => {
		vi.mocked(getStoredLanguage).mockReturnValue(undefined);
		vi.mocked(detectBrowserLanguage).mockReturnValue("en");

		renderHook(() => {
			useLanguageDetector();
		});

		expect(detectBrowserLanguage).toHaveBeenCalledWith("en-US");
	});
});
