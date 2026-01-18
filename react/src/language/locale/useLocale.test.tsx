/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { renderHook } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import useLanguage from "./useLanguage";
import useLocale from "./useLocale";

vi.mock("react-i18next");
vi.mock("./useLanguage");

describe("useLocale", () => {
	it("returns lang from useLanguage and t from useTranslation", () => {
		vi.mocked(useLanguage).mockReturnValue("es");
		vi.mocked(useTranslation).mockReturnValue({
			t: (key: string) => `X:${key}`,
			i18n: { languages: ["en", "es"] },
		} as unknown as ReturnType<typeof useTranslation>);

		const { result } = renderHook(() => useLocale());
		expect(result.current.lang).toBe("es");
		expect((result.current.t as (key: string) => string)("pages.home.title")).toBe(
			"X:pages.home.title",
		);
	});
});
