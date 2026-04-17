import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import MultiLanguagePicker from "./MultiLanguagePicker";

vi.mock("react-i18next");

const LANGUAGE_PLACEHOLDER = "{{language}}";

/**
 * Lightweight translation helper used by tests to simulate `t` from
 * `react-i18next`.
 *
 * The function returns the provided `defaultValue` when present. If the
 * `defaultValue` contains the template placeholder `{{language}}` and an
 * options object provides a `language` property, the placeholder is
 * replaced. When `defaultValue` is not supplied the raw key is returned.
 *
 * @param key - Translation key to resolve when no default is provided
 * @param defaultValue - Optional fallback string used in tests
 * @param options - Optional interpolation/context object (may include `language`)
 * @returns The resolved translation or the provided fallback
 */
function translateOrDefault(
	key: string,
	defaultValue?: string,
	options?: Record<string, unknown>,
): string {
	if (defaultValue === undefined) {
		return key;
	}

	const language = options?.["language"];
	if (defaultValue.includes(LANGUAGE_PLACEHOLDER) && typeof language === "string") {
		return defaultValue.replace(LANGUAGE_PLACEHOLDER, language);
	}

	return defaultValue;
}

describe("multi language picker", () => {
	it("adds a language from the picker", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onChange = vi.fn();

		render(<MultiLanguagePicker value={["es"]} onChange={onChange} excludedCodes={["en"]} />);

		fireEvent.click(screen.getByRole("button", { name: /add language/i }));
		fireEvent.change(screen.getByPlaceholderText("Search languages..."), {
			target: { value: "french" },
		});
		fireEvent.click(screen.getByRole("option", { name: /french/i }));

		expect(onChange).toHaveBeenCalledWith(["es", "fr"]);
	});

	it("removes a selected language with the x button", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onChange = vi.fn();

		render(<MultiLanguagePicker value={["es", "fr"]} onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: /remove spanish/i }));

		expect(onChange).toHaveBeenCalledWith(["fr"]);
	});

	it("shows an empty state when no translation languages are selected", () => {
		cleanup();
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);

		render(<MultiLanguagePicker value={[]} onChange={vi.fn()} />);

		expect(screen.getByText("No languages selected yet.")).toBeTruthy();
	});
});
