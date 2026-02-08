import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import { defaultLanguage } from "@/shared/language/supported-languages";

import useLanguage from "./useLanguage";

vi.mock("react-i18next");

describe("useLanguage", () => {
	function setup(lang: string): () => void {
		mockUseTranslation(lang);
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
