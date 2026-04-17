import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import LanguagePicker from "./LanguagePicker";

vi.mock("react-i18next");

/**
 * @param key - translation key
 * @param defaultValue - fallback value
 * @returns translated value or default
 */
function translateOrDefault(key: string, defaultValue?: string): string {
	return defaultValue ?? key;
}

describe("language picker", () => {
	it("renders the selected language name for the current value", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);

		render(<LanguagePicker value="en" onChange={vi.fn()} />);

		expect(screen.getByRole("button", { name: /english/i })).toBeTruthy();
	});

	it("selects a language from the search results", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onChange = vi.fn();

		render(<LanguagePicker value={undefined} onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: /select language/i }));
		fireEvent.change(screen.getByPlaceholderText("Search languages..."), {
			target: { value: "spanish" },
		});
		fireEvent.click(screen.getByRole("option", { name: /spanish/i }));

		expect(onChange).toHaveBeenCalledWith("es");
	});

	it("selects Arabic from the search results", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onChange = vi.fn();

		render(<LanguagePicker value={undefined} onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: /select language/i }));
		fireEvent.change(screen.getByPlaceholderText("Search languages..."), {
			target: { value: "arabic" },
		});
		fireEvent.click(screen.getByRole("option", { name: /arabic/i }));

		expect(onChange).toHaveBeenCalledWith("ar");
	});

	it("clears an optional selection and excludes hidden codes from search results", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onChange = vi.fn();

		render(
			<LanguagePicker
				value="en"
				onChange={onChange}
				excludedCodes={["es"]}
				optional
				placeholder="None"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /english/i }));
		fireEvent.change(screen.getByPlaceholderText("Search languages..."), {
			target: { value: "spanish" },
		});
		expect(screen.queryByRole("listbox")).toBeNull();
		expect(screen.getByText("No languages found")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /^none$/i }));

		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it("shows the no-results state when a search has no matches", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);

		render(<LanguagePicker value={undefined} onChange={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: /select language/i }));
		fireEvent.change(screen.getByPlaceholderText("Search languages..."), {
			target: { value: "zzzz" },
		});

		expect(screen.getByText("No languages found")).toBeTruthy();
	});
});
