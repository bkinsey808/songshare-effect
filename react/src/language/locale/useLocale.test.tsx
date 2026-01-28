import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/test-utils/mockUseTranslation";

import useLanguage from "./useLanguage";
import useLocale from "./useLocale";

vi.mock("react-i18next");
vi.mock("./useLanguage");

describe("useLocale", () => {
	it("returns lang from useLanguage and t from useTranslation", () => {
		vi.mocked(useLanguage).mockReturnValue("es");
		mockUseTranslation("en");

		const { result } = renderHook(() => useLocale());
		expect(result.current.lang).toBe("es");
		expect((result.current.t as (key: string) => string)("pages.home.title")).toBe(
			"X:pages.home.title",
		);
	});
});
