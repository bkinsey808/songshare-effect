import { render } from "@testing-library/react";
import { Effect } from "effect";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import forceCast from "@/react/lib/test-utils/forceCast";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";

import { type SongPublic } from "../song-schema";
import SongViewSlides from "./slides/SongViewSlides";
import SongView from "./SongView";
import SongViewDetails from "./SongViewDetails";
import SongViewLibraryAction from "./SongViewLibraryAction";

// Mock react-router so tests can control `useParams` return values
vi.mock("react-router-dom");
// Simplified i18n mock: `t` returns the `defaultVal` when provided, otherwise the key.
vi.mock("@/react/lib/language/locale/useLocale");
// Mock ShareButton to avoid popover complexity in integration tests
vi.mock("@/react/lib/design-system/share-button/ShareButton");
vi.mock("@/react/lib/qr-code/CollapsibleQrCode");
vi.mock("@/react/share/shared-users-section/SharedUsersSection");
vi.mock("./SongViewLibraryAction");
vi.mock("./slides/SongViewSlides");
vi.mock("./SongViewDetails");
// Avoid coupling SongView tests to share subscription side effects — called from useSongView
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

/**
 * @param key - translation key
 * @param defaultVal - fallback value
 * @returns translated value or default
 */
function translateOrDefault(key: string, defaultVal?: string | Record<string, unknown>): string {
	return typeof defaultVal === "string" ? defaultVal : key;
}

function installUiMocks(): void {
	vi.mocked(SongViewLibraryAction).mockImplementation(() => undefined);
	vi.mocked(SongViewSlides).mockImplementation(() => undefined);
	vi.mocked(SongViewDetails).mockImplementation(() => undefined);
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({
			lang: "en",
			t: translateOrDefault,
		}),
	);
	vi.mocked(CollapsibleQrCode).mockImplementation(() => <div data-testid="qr-code" />);
	vi.mocked(ShareButton).mockImplementation(() => <button type="button">Share</button>);
	vi.mocked(SharedUsersSection).mockImplementation(() => (
		<div data-testid="shared-users-section" />
	));
	vi.mocked(useShareSubscription).mockImplementation(() => undefined);
}

type StoreMockOptions = {
	mockAdd?: unknown;
	publicSongs?: Record<string, SongPublic>;
	mockUserId?: string;
	isSignedIn?: boolean;
};

function installStoreMocks({
	mockAdd,
	publicSongs = {},
	mockUserId,
	isSignedIn,
}: StoreMockOptions = {}): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const fakeState = {
			addActivePublicSongSlugs: mockAdd,
			publicSongs,
			privateSongs: {},
			userSessionData: mockUserId === undefined ? undefined : { user: { user_id: mockUserId } },
			isSignedIn,
		};
		return forceCast<(state: typeof fakeState) => unknown>(selector)(fakeState);
	});
}

// Unit tests for `SongView` component: assert slug handling and store interaction
describe("song view", () => {
	it("renders 'Song not found' when no song param is present", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({});
		installStoreMocks();

		const { getByText } = render(<SongView />);

		expect(getByText(NOT_FOUND_TEXT)).toBeTruthy();
	});

	it("calls addActivePublicSongSlugs and renders song heading and QR code when song is found", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeSongPublic({ song_slug: MY_SLUG, user_id: "owner-1" });
		installStoreMocks({
			mockAdd,
			publicSongs: { [songPublic.song_id]: songPublic },
			mockUserId: "not-owner",
		});
		vi.mocked(addUserToLibraryEffect).mockReturnValue(Effect.sync(() => undefined));

		const { getByRole, getByTestId } = render(<SongView />);

		expect(getByRole("heading", { name: "My Song" })).toBeTruthy();
		expect(getByTestId("qr-code")).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([MY_SLUG]);
		// Auto-add should be called with the owner id as the request shape
		expect(vi.mocked(addUserToLibraryEffect)).toHaveBeenCalledWith(
			{ followed_user_id: "owner-1" },
			expect.any(Function),
		);
	});

	it("shows Song not found when slug is not in publicSongs", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: NO_SLUG });
		const mockAdd = vi.fn();
		installStoreMocks({ mockAdd });

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		expect(matches.length).toBeGreaterThanOrEqual(MIN_ONE);
		expect(matches[FIRST_INDEX]).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([NO_SLUG]);
	});

	it("does not call addActivePublicSongSlugs when slug is only whitespace", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: WHITESPACE_SLUG });
		const mockAdd = vi.fn();
		installStoreMocks({ mockAdd });

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		expect(matches.length).toBeGreaterThanOrEqual(MIN_ONE);
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it("hides ShareButton when user is not signed in", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const songPublic = makeSongPublic({ song_slug: MY_SLUG });
		installStoreMocks({
			mockAdd: vi.fn().mockResolvedValue(undefined),
			publicSongs: { [songPublic.song_id]: songPublic },
			isSignedIn: false,
		});
		vi.mocked(addUserToLibraryEffect).mockReturnValue(Effect.sync(() => undefined));

		const { queryByRole } = render(<SongView />);

		expect(queryByRole("button", { name: "Share" })).toBeNull();
	});

	it("shows ShareButton when user is signed in", () => {
		installUiMocks();
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const songPublic = makeSongPublic({ song_slug: MY_SLUG });
		installStoreMocks({
			mockAdd: vi.fn().mockResolvedValue(undefined),
			publicSongs: { [songPublic.song_id]: songPublic },
			mockUserId: "u1",
			isSignedIn: true,
		});
		vi.mocked(addUserToLibraryEffect).mockReturnValue(Effect.sync(() => undefined));

		const { getByRole } = render(<SongView />);

		expect(getByRole("button", { name: "Share" })).toBeTruthy();
	});
});
