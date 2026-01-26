import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useLocale from "@/react/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import Navigation from "./Navigation";

vi.mock("@/react/language/locale/useLocale");
/* eslint-disable typescript-eslint/consistent-type-imports -- mock factory needs module type for importOriginal and return */
/* eslint-disable jest/no-untyped-mock-factory -- factory is typed via Promise<typeof import(...)> return; vi.mock generic would break tsc */
vi.mock("react-router-dom", async (importOriginal): Promise<typeof import("react-router-dom")> => {
	const actual = await importOriginal<typeof import("react-router-dom")>();
	return { ...actual, useNavigate: vi.fn() };
});
/* eslint-enable typescript-eslint/consistent-type-imports */
/* eslint-enable jest/no-untyped-mock-factory */

describe("navigation - language-aware links", () => {
	it("builds links using buildPathWithLang (home + about)", () => {
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment
		vi.mocked(useLocale).mockImplementation(
			(): ReturnType<typeof useLocale> => ({
				lang: "es",
				// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
				t: ((key: string) => key) as ReturnType<typeof useLocale>["t"],
			}),
		);

		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);

		render(
			<MemoryRouter initialEntries={["/es"]}>
				<Navigation />
			</MemoryRouter>,
		);

		const homeButton = screen.getByRole("button", { name: "navigation.home" });
		expect(homeButton).toBeTruthy();
		fireEvent.click(homeButton);
		expect(mockNavigate).toHaveBeenCalledWith(buildPathWithLang("/", "es"));

		const aboutButton = screen.getByRole("button", { name: "navigation.about" });
		expect(aboutButton).toBeTruthy();
		fireEvent.click(aboutButton);
		expect(mockNavigate).toHaveBeenCalledWith(buildPathWithLang("/about", "es"));
	});
});
