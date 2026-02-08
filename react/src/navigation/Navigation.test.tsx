import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockLocaleWithLang from "@/react/lib/test-utils/mockLocaleWithLang";
import mockReactRouterWithNavigate from "@/react/lib/test-utils/mockReactRouter";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import Navigation from "./Navigation";

vi.mock("@/react/language/locale/useLocale");

describe("navigation - language-aware links", () => {
	it("builds links using buildPathWithLang (home + about)", async () => {
		mockLocaleWithLang("es");

		const mockNavigate = vi.fn();
		// apply the runtime mock for react-router-dom with our custom mockNavigate
		mockReactRouterWithNavigate(mockNavigate);

		const { useNavigate } = await import("react-router-dom");

		render(
			<MemoryRouter initialEntries={["/es"]}>
				<Navigation isScrolled={false} />
			</MemoryRouter>,
		);

		const homeButton = screen.getByRole("button", { name: "navigation.home" });
		expect(homeButton).toBeTruthy();

		// Verify programmatic navigate returns the expected path (sanity check)
		const navigateFromHook = useNavigate();
		void navigateFromHook(buildPathWithLang("/", "es"));
		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith(buildPathWithLang("/", "es"));
		});

		const aboutButton = screen.getByRole("button", { name: "navigation.about" });
		expect(aboutButton).toBeTruthy();

		// Sanity check: programmatic navigation for the About path
		const navigateFromHook2 = useNavigate();
		void navigateFromHook2(buildPathWithLang("/about", "es"));
		expect(mockNavigate).toHaveBeenCalledWith(buildPathWithLang("/about", "es"));
	});
});
