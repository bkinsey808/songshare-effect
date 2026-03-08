import { render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import UserLibrary from "@/react/user-library/UserLibrary";

import UserLibraryPage from "./UserLibraryPage";

vi.mock("react-i18next");
vi.mock("@/react/user-library/UserLibrary");

function translateOrDefault(key: string, defaultValue?: string): string {
	return defaultValue ?? key;
}

describe("user library page", () => {
	it("renders title and description and UserLibrary component", () => {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		vi.mocked(UserLibrary).mockImplementation(() => <div data-testid="user-library" />);

		render(<UserLibraryPage />);

		expect(screen.getByText("User Library")).toBeTruthy();
		expect(screen.getByText("Manage users you follow")).toBeTruthy();
		expect(screen.getByTestId("user-library")).toBeTruthy();
	});
});
