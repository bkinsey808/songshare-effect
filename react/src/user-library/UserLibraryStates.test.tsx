import { render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import AddUserForm from "./user-add/AddUserForm";
import UserLibraryEmptyState from "./UserLibraryEmptyState";
import UserLibraryErrorState from "./UserLibraryErrorState";
import UserLibraryLoadingState from "./UserLibraryLoadingState";

vi.mock("react-i18next");
vi.mock("./user-add/AddUserForm");

/**
 * @param key - translation key
 * @param defaultValue - fallback value
 * @returns translated value or default
 */
function translateOrDefault(key: string, defaultValue?: string): string {
	return defaultValue ?? key;
}

describe("user library states", () => {
	/**
	 * Install mocks for translation and child components used by state tests.
	 *
	 * @returns void
	 */
	function installMocks(): void {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		vi.mocked(AddUserForm).mockImplementation(() => <div data-testid="add-user" />);
	}

	it("renders loading message", () => {
		installMocks();

		render(<UserLibraryLoadingState />);

		expect(screen.getByText("Loading your user library...")).toBeTruthy();
	});

	it("renders empty state with add form and description", () => {
		installMocks();

		render(<UserLibraryEmptyState />);

		expect(screen.getByTestId("add-user")).toBeTruthy();
		expect(screen.getByText("Your user library is empty")).toBeTruthy();
		expect(screen.getByText("Follow users to see them here.")).toBeTruthy();
	});

	it("renders error state with title and message", () => {
		installMocks();

		render(<UserLibraryErrorState error="boom" />);

		expect(screen.getByText("Error Loading Library")).toBeTruthy();
		expect(screen.getByText("boom")).toBeTruthy();
	});
});
