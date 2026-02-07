import { render, screen } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import UserLibrary from "./UserLibrary";
import useUserLibrary from "./useUserLibrary";

vi.mock("./useUserLibrary");

vi.mock("./UserLibraryLoadingState", (): { default: () => ReactElement } => ({
	default: (): ReactElement => <div data-testid="loading" />,
}));

vi.mock(
	"./UserLibraryErrorState",
	(): { default: ({ error }: { error?: string }) => ReactElement } => ({
		default: ({ error }: { error?: string }): ReactElement => (
			<div data-testid="error">{error}</div>
		),
	}),
);

vi.mock("./UserLibraryEmptyState", (): { default: () => ReactElement } => ({
	default: (): ReactElement => <div data-testid="empty" />,
}));

vi.mock("./user-add/AddUserForm", (): { default: () => ReactElement } => ({
	default: (): ReactElement => <div data-testid="add-user" />,
}));

vi.mock(
	"./card/UserLibraryCard",
	(): { default: ({ entry }: { entry: { followed_user_id: string } }) => ReactElement } => ({
		default: ({ entry }: { entry: { followed_user_id: string } }): ReactElement => (
			<div data-testid={`card-${entry.followed_user_id}`} />
		),
	}),
);

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

describe("user library component", () => {
	it("renders loading state when loading", () => {
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_LOADING);

		render(<UserLibrary />);

		expect(screen.getByTestId("loading")).toBeTruthy();
	});

	it("renders error state when error present", () => {
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_ERROR);

		render(<UserLibrary />);

		expect(screen.getByTestId("error").textContent).toBe("oops");
	});

	it("renders empty state when no entries", () => {
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_EMPTY);

		render(<UserLibrary />);

		expect(screen.getByTestId("empty")).toBeTruthy();
	});

	it("renders list of entries and add form", () => {
		vi.mocked(useUserLibrary).mockReturnValue(MOCK_WITH_ENTRY);

		render(<UserLibrary />);

		expect(screen.getByTestId("add-user")).toBeTruthy();
		expect(screen.getByTestId("card-u1")).toBeTruthy();
	});
});
