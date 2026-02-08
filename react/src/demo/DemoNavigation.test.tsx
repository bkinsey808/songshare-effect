import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useLocale from "@/react/lib/language/locale/useLocale";
import { reactFeaturesPath } from "@/shared/paths";

import DemoNavigation from "./DemoNavigation";

vi.mock("@/react/language/locale/useLocale");

describe("demoNavigation - language-aware links", () => {
	it("constructs demo links with the language prefix", () => {
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
				<DemoNavigation />
			</MemoryRouter>,
		);

		const link = screen.getByText("navigation.reactFeatures").closest("a");
		expect(link).toBeTruthy();
		expect(link?.getAttribute("href")).toBe(`/es/${reactFeaturesPath}`);
	});
});
