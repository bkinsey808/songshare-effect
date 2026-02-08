/* oxlint-disable unicorn/no-null */
import { render, waitFor } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import getStoredLanguage from "../stored/getStoredLanguage";
import setStoredLanguage from "../stored/setStoredLanguage";
import LanguageProvider from "./LanguageProvider";

vi.mock("react-router-dom");
vi.mock("react-i18next");
vi.mock("../stored/getStoredLanguage");
vi.mock("../stored/setStoredLanguage");

describe("language provider", () => {
	function setup(): () => void {
		vi.mocked(useParams).mockReturnValue({ lang: "es" });
		// Stub react-i18next runtime used by LanguageProvider
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
		vi.mocked(useTranslation).mockReturnValue({
			i18n: { language: "en", changeLanguage: vi.fn() },
			t: vi.fn(),
		} as unknown as ReturnType<typeof useTranslation>);
		// Ensure setStoredLanguage resolves when called (async public API)
		vi.mocked(setStoredLanguage).mockResolvedValue(undefined);
		return () => {
			vi.clearAllMocks();
		};
	}

	it("writes stored preference when none exists (async Cookie Store path)", async () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockResolvedValue(undefined);
		const getSpy = vi.fn();
		getSpy.mockResolvedValue(undefined);
		vi.stubGlobal("cookieStore", { get: getSpy });

		render(<LanguageProvider />);

		// wait for async preference-resolution to complete
		await waitFor(() => {
			expect(vi.mocked(setStoredLanguage)).toHaveBeenCalledWith("es");
		});
		cleanup();
	});

	it("does not overwrite an existing stored preference", async () => {
		const cleanup = setup();
		vi.mocked(getStoredLanguage).mockResolvedValue("zh");
		const getSpy = vi.fn();
		getSpy.mockResolvedValue({ value: "zh" });
		vi.stubGlobal("cookieStore", { get: getSpy });

		render(<LanguageProvider />);

		// wait for async preference-resolution to complete
		await waitFor(() => {
			expect(vi.mocked(setStoredLanguage)).not.toHaveBeenCalled();
		});
		cleanup();
	});
});
