import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useLocale from "@/react/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import Navigation from "./Navigation";

vi.mock("@/react/language/locale/useLocale");

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

		render(
			<MemoryRouter initialEntries={["/es"]}>
				<Navigation />
			</MemoryRouter>,
		);

		const homeLink = screen.getByText("navigation.home").closest("a");
		expect(homeLink).toBeTruthy();
		expect(homeLink?.getAttribute("href")).toBe(buildPathWithLang("/", "es"));

		const aboutLink = screen.getByText("navigation.about").closest("a");
		expect(aboutLink).toBeTruthy();
		expect(aboutLink?.getAttribute("href")).toBe(buildPathWithLang("/about", "es"));
	});
});
