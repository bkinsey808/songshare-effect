import { cleanup, render } from "@testing-library/react";
import { Effect } from "effect";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import ShareButton from "@/react/lib/design-system/ShareButton";
import forceCast from "@/react/lib/test-utils/forceCast";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.mock";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";
import { type SongPublic } from "../song-schema";

import SongView from "./SongView";
import SongViewLibraryAction from "./SongViewLibraryAction";


// Mock react-router so tests can control `useParams` return values
vi.mock("react-router-dom");
// Simplified i18n mock: `t` returns the `defaultVal` when provided, otherwise the key.
vi.mock("react-i18next");
// Mock ShareButton to avoid popover complexity in integration tests
vi.mock("@/react/lib/design-system/ShareButton");
vi.mock("@/react/share/shared-users-section/SharedUsersSection");
vi.mock("./SongViewLibraryAction");
// Avoid coupling SongView tests to share subscription side effects/state shape
vi.mock("@/react/share/subscribe/useShareSubscription");
// Mock the store module so tests can set implementations
vi.mock("@/react/app-store/useAppStore");
// Stub the addUserToLibrary effect used by the view-side auto-follow
vi.mock("@/react/user-library/user-add/addUserToLibraryEffect");

// Test constants used across cases
const NOT_FOUND_TEXT = "Song not found";
const MY_SLUG = "my-slug";
const NO_SLUG = "no-slug";
const WHITESPACE_SLUG = "   ";
const MIN_ONE = 1;
const FIRST_INDEX = 0;

function translateOrDefault(key: string, defaultVal?: string | Record<string, unknown>): string {
	return typeof defaultVal === "string" ? defaultVal : key;
}

function installUiMocks(): void {
	vi.mocked(SongViewLibraryAction).mockImplementation(() => undefined);
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: translateOrDefault,
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);
	vi.mocked(ShareButton).mockImplementation(() => <button type="button">Share</button>);
	vi.mocked(SharedUsersSection).mockImplementation(() => (
		<div data-testid="shared-users-section" />
	));
	vi.mocked(useShareSubscription).mockImplementation(() => undefined);
}

function installStoreMocks(
	mockAdd: unknown,
	publicSongs: Record<string, SongPublic> = {},
	mockUserId?: string,
): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const fakeState = {
			addActivePublicSongSlugs: mockAdd,
			publicSongs,
			privateSongs: {},
			userSessionData:
			mockUserId === undefined ? undefined : { user: { user_id: mockUserId } },
		};
		return forceCast<(state: typeof fakeState) => unknown>(selector)(fakeState);
	});
}

// Unit tests for `SongView` component: assert slug handling and store interaction
describe("song view", () => {
	it("renders 'Song not found' when no song param is present", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({});
		installStoreMocks(vi.fn());

		const { getByText } = render(<SongView />);

		expect(getByText(NOT_FOUND_TEXT)).toBeTruthy();
		cleanup();
	});

	it("calls addActivePublicSongSlugs and displays song when valid songPublic is found", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeSongPublic({ song_slug: MY_SLUG, user_id: "owner-1" });
		installStoreMocks(mockAdd, { [songPublic.song_id]: songPublic }, "not-owner");
		const mockAutoAdd = vi.mocked(addUserToLibraryEffect);
		vi.mocked(mockAutoAdd).mockReturnValue(Effect.sync(() => undefined));

		const { getByRole, getByText } = render(<SongView />);

		expect(getByRole("heading", { name: "My Song" })).toBeTruthy();
		expect(getByText(MY_SLUG)).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([MY_SLUG]);
		// Auto-add should be called with the owner id as the request shape
		expect(mockAutoAdd).toHaveBeenCalledWith({ followed_user_id: "owner-1" }, expect.any(Function));
		cleanup();
	});

	it("shows Song not found when slug is not in publicSongs", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: NO_SLUG });
		const mockAdd = vi.fn();
		installStoreMocks(mockAdd);

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		expect(matches.length).toBeGreaterThanOrEqual(MIN_ONE);
		expect(matches[FIRST_INDEX]).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([NO_SLUG]);
		cleanup();
	});

	// Whitespace-only slug should be treated as missing; ensure no store selectors are invoked
	it("does not call addActivePublicSongSlugs when slug is only whitespace", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: WHITESPACE_SLUG });
		const mockAdd = vi.fn();
		installStoreMocks(mockAdd);

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		const EXPECTED_MATCHES = 1;
		expect(matches.length).toBeGreaterThanOrEqual(EXPECTED_MATCHES);
		expect(mockAdd).not.toHaveBeenCalled();
	});
});
