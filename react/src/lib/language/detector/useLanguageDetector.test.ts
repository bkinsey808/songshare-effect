import { renderHook } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import detectBrowserLanguage from "@/shared/language/detectBrowserLanguage";

import getStoredLanguage from "../stored/getStoredLanguage";
import useLanguageDetector from "./useLanguageDetector";

vi.mock("react-router-dom");
vi.mock("@/shared/language/detectBrowserLanguage");
vi.mock("../stored/getStoredLanguage");

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

	it("redirects to stored language if available", async () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockResolvedValue("zh");
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		vi.mocked(detectBrowserLanguage).mockImplementation(
			(): ReturnType<typeof detectBrowserLanguage> => "en",
		);

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
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		vi.mocked(detectBrowserLanguage).mockImplementation(
			(): ReturnType<typeof detectBrowserLanguage> => "es",
		);

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
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		vi.mocked(detectBrowserLanguage).mockImplementation(
			(): ReturnType<typeof detectBrowserLanguage> => "en",
		);

		renderHook(() => {
			useLanguageDetector();
		});

		await Promise.resolve();
		expect(detectBrowserLanguage).toHaveBeenCalledWith("en-US");
		cleanup();
	});
});
