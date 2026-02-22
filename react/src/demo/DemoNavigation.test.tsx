import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import { reactFeaturesPath } from "@/shared/paths";

import DemoNavigation from "./DemoNavigation";

vi.mock("@/react/lib/language/locale/useLocale");

describe("demoNavigation - language-aware links", () => {
	it("constructs demo links with the language prefix", () => {
		// provide a typed mock of useLocale without inline disables
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "es",
				t: (key: string) => key,
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
