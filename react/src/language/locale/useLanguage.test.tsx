/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { renderHook } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import useLanguage from "./useLanguage";

vi.mock("react-i18next");

describe("useLanguage", () => {
	function setup(lang: string): () => void {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		vi.mocked(useTranslation).mockReturnValue({
			i18n: { language: lang, changeLanguage: vi.fn() },
			t: vi.fn(),
		} as unknown as ReturnType<typeof useTranslation>);
		return () => vi.clearAllMocks();
	}

	it("returns the runtime language when it's supported", () => {
		const cleanup = setup("es");
		const { result } = renderHook(() => useLanguage());
		expect(result.current).toBe("es");
		cleanup();
	});

	it("falls back to defaultLanguage when runtime language is unsupported", () => {
		const cleanup = setup("zz");
		const { result } = renderHook(() => useLanguage());
		expect(result.current).toBe(defaultLanguage);
		cleanup();
	});
});
