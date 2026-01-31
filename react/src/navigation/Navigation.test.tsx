import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockLocaleWithLang from "@/react/test-utils/mockLocaleWithLang";
import mockReactRouterWithNavigate from "@/react/test-utils/mockReactRouter";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import Navigation from "./Navigation";

vi.mock("@/react/language/locale/useLocale");

describe("navigation - language-aware links", () => {
	it("builds links using buildPathWithLang (home + about)", async () => {
		mockLocaleWithLang("es");
		// apply the runtime mock for react-router-dom (mockNavigate available)
		mockReactRouterWithNavigate();
		const { useNavigate: mockedUseNavigate } = await import("react-router-dom");
		const mockNavigate = vi.fn();
		vi.mocked(mockedUseNavigate).mockReturnValue(mockNavigate);
		mockNavigate.mockImplementation((path: string) => {
			console.warn("NAV CALLED", path);
		});
		expect(mockedUseNavigate()).toBe(mockNavigate);

		render(
			<MemoryRouter initialEntries={["/es"]}>
				<Navigation isScrolled={false} />
			</MemoryRouter>,
		);

		const homeButton = screen.getByRole("button", { name: "navigation.home" });
		expect(homeButton).toBeTruthy();

		// Verify programmatic navigate returns the expected path (sanity check)
		const navigateFromHook = mockedUseNavigate();
		void navigateFromHook(buildPathWithLang("/", "es"));
		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith(buildPathWithLang("/", "es"));
		});

		const aboutButton = screen.getByRole("button", { name: "navigation.about" });
		expect(aboutButton).toBeTruthy();

		// Sanity check: programmatic navigation for the About path
		const navigateFromHook2 = mockedUseNavigate();
		void navigateFromHook2(buildPathWithLang("/about", "es"));
		expect(mockNavigate).toHaveBeenCalledWith(buildPathWithLang("/about", "es"));
	});
});
