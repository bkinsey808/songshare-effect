import { render, screen } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import UserLibraryCard from "./card/UserLibraryCard";
import AddUserForm from "./user-add/AddUserForm";
import UserLibrary from "./UserLibrary";
import UserLibraryEmptyState from "./UserLibraryEmptyState";
import UserLibraryErrorState from "./UserLibraryErrorState";
import UserLibraryLoadingState from "./UserLibraryLoadingState";
import useUserLibrary from "./useUserLibrary";

vi.mock("./useUserLibrary");
vi.mock("./UserLibraryLoadingState");
vi.mock("./UserLibraryErrorState");
vi.mock("./UserLibraryEmptyState");
vi.mock("./user-add/AddUserForm");
vi.mock("./card/UserLibraryCard");

const MOCK_LOADING = {
	entries: [],
	isLoading: true,
	error: undefined,
	currentUserId: undefined,
	songLibraryEntries: {},
	playlistLibraryEntries: {},
	removeFromUserLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
} satisfies ReturnType<typeof useUserLibrary>;

const MOCK_ERROR = {
	entries: [],
	isLoading: false,
	error: "oops",
	currentUserId: undefined,
	songLibraryEntries: {},
	playlistLibraryEntries: {},
	removeFromUserLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
} satisfies ReturnType<typeof useUserLibrary>;

const MOCK_EMPTY = {
	entries: [],
	isLoading: false,
	error: undefined,
	currentUserId: undefined,
	songLibraryEntries: {},
	playlistLibraryEntries: {},
	removeFromUserLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
} satisfies ReturnType<typeof useUserLibrary>;

const MOCK_WITH_ENTRY = {
	entries: [
		{
			followed_user_id: "u1",
			created_at: new Date().toISOString(),
			user_id: "u1",
		},
	],
	isLoading: false,
	error: undefined,
	currentUserId: undefined,
	songLibraryEntries: {},
	playlistLibraryEntries: {},
	removeFromUserLibrary: (): Effect.Effect<void, Error> => Effect.sync(() => undefined),
} satisfies ReturnType<typeof useUserLibrary>;

function installUiMocks(): void {
	vi.mocked(UserLibraryLoadingState).mockImplementation(() => <div data-testid="loading" />);
	vi.mocked(UserLibraryErrorState).mockImplementation(({ error }) => (
		<div data-testid="error">{error}</div>
	));
	vi.mocked(UserLibraryEmptyState).mockImplementation(() => <div data-testid="empty" />);
	vi.mocked(AddUserForm).mockImplementation(() => <div data-testid="add-user" />);
	vi.mocked(UserLibraryCard).mockImplementation(({ entry }) => (
		<div data-testid={`card-${entry.followed_user_id}`} />
	));
}

describe("user library component", () => {
	it("renders loading state when loading", () => {
		installUiMocks();
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_LOADING);

		render(<UserLibrary />);

		expect(screen.getByTestId("loading")).toBeTruthy();
	});

	it("renders error state when error present", () => {
		installUiMocks();
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_ERROR);

		render(<UserLibrary />);

		expect(screen.getByTestId("error").textContent).toBe("oops");
	});

	it("renders empty state when no entries", () => {
		installUiMocks();
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_EMPTY);

		render(<UserLibrary />);

		expect(screen.getByTestId("empty")).toBeTruthy();
	});

	it("renders list of entries and add form", () => {
		installUiMocks();
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_WITH_ENTRY);

		render(<UserLibrary />);

		expect(screen.getByTestId("add-user")).toBeTruthy();
		expect(screen.getByTestId("card-u1")).toBeTruthy();
	});
});
