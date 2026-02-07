import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import UserLibraryEmptyState from "./UserLibraryEmptyState";
import UserLibraryErrorState from "./UserLibraryErrorState";
import UserLibraryLoadingState from "./UserLibraryLoadingState";

vi.mock(
	"react-i18next",
	(): { useTranslation: () => { t: (key: string, defaultValue?: string) => string } } => ({
		useTranslation: (): { t: (key: string, defaultValue?: string) => string } => ({
			t: (key: string, defaultValue?: string): string =>
				typeof defaultValue === "string" ? defaultValue : key,
		}),
	}),
);

vi.mock("./user-add/AddUserForm", (): { default: () => React.ReactElement } => ({
	default: (): React.ReactElement => <div data-testid="add-user" />,
}));

describe("user library states", () => {
	it("renders loading message", () => {
		render(<UserLibraryLoadingState />);

		expect(screen.getByText("Loading your user library...")).toBeTruthy();
	});

	it("renders empty state with add form and description", () => {
		render(<UserLibraryEmptyState />);

		expect(screen.getByTestId("add-user")).toBeTruthy();
		expect(screen.getByText("Your user library is empty")).toBeTruthy();
		expect(screen.getByText("Follow users to see them here.")).toBeTruthy();
	});

	it("renders error state with title and message", () => {
		render(<UserLibraryErrorState error="boom" />);

		expect(screen.getByText("Error Loading Library")).toBeTruthy();
		expect(screen.getByText("boom")).toBeTruthy();
	});
});
