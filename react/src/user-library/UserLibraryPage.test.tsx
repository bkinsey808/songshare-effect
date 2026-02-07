import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UserLibraryPage from "./UserLibraryPage";

vi.mock(
	"react-i18next",
	(): { useTranslation: () => { t: (key: string, defaultValue?: string) => string } } => ({
		useTranslation: (): { t: (key: string, defaultValue?: string) => string } => ({
			t: (key: string, defaultValue?: string): string =>
				typeof defaultValue === "string" ? defaultValue : key,
		}),
	}),
);

vi.mock("@/react/user-library/UserLibrary", (): { default: () => ReactElement } => ({
	default: (): ReactElement => <div data-testid="user-library" />,
}));

describe("user library page", () => {
	it("renders title and description and UserLibrary component", () => {
		render(<UserLibraryPage />);

		expect(screen.getByText("User Library")).toBeTruthy();
		expect(screen.getByText("Manage users you follow")).toBeTruthy();
		expect(screen.getByTestId("user-library")).toBeTruthy();
	});
});
