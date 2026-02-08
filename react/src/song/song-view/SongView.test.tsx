import { cleanup, render } from "@testing-library/react";
import { Effect } from "effect";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.mock";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";

import SongView from "./SongView";

// Mock react-router so tests can control `useParams` return values
vi.mock("react-router-dom");
// Simplified i18n mock: `t` returns the `defaultVal` when provided, otherwise the key.
vi.mock(
	"react-i18next",
	(): {
		useTranslation: () => {
			t: (key: string, defaultVal?: string | Record<string, unknown>) => string;
			i18n: { language: string };
		};
	} => ({
		useTranslation: (): {
			t: (key: string, defaultVal?: string | Record<string, unknown>) => string;
			i18n: { language: string };
		} => ({
			t: (key: string, defaultVal?: string | Record<string, unknown>): string =>
				typeof defaultVal === "string" ? defaultVal : key,
			i18n: { language: "en" },
		}),
	}),
);
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

function makeSongPublicLike(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return makeSongPublic({
		song_slug: MY_SLUG,
		...(overrides as Partial<Partial<Record<string, unknown>>>),
	});
}

/**
 * Stub `useAppStoreSelector` to return provided mocks depending on which
 * selector is used. Tests reference selectors by their function name, so
 * we stringify the selector and match substrings to decide which mock to
 * return.
 *
 * @param mockAdd - returned value when the selector looks like `addActivePublicSongSlugs`
 * @param mockGet - returned value when the selector looks like `getSongBySlug`
 */
function installStoreMocks(mockAdd: unknown, mockGet: unknown, mockUserId?: string): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorText = String(selector);
		if (selectorText.includes("addActivePublicSongSlugs")) {
			return mockAdd;
		}
		if (selectorText.includes("getSongBySlug")) {
			return mockGet;
		}
		if (selectorText.includes("userSessionData")) {
			return { user: { user_id: mockUserId } };
		}
		return undefined;
	});
}

// Unit tests for `SongView` component: assert slug handling and store interaction
describe("song view", () => {
	it("renders 'Song not found' when no song param is present", () => {
		vi.mocked(useParams).mockReturnValue({});
		installStoreMocks(vi.fn(), vi.fn());

		const { getByText } = render(<SongView />);

		expect(getByText(NOT_FOUND_TEXT)).toBeTruthy();
		cleanup();
	});

	it("calls addActivePublicSongSlugs and displays song when valid songPublic is found", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeSongPublicLike({ user_id: "owner-1" });
		const mockGet = vi.fn().mockReturnValue({ song: undefined, songPublic });
		installStoreMocks(mockAdd, mockGet, "not-owner");
		const mockAutoAdd = vi.mocked(addUserToLibraryEffect);
		vi.mocked(mockAutoAdd).mockReturnValue(Effect.sync(() => undefined));

		const { getByRole, getByText } = render(<SongView />);

		expect(getByRole("heading", { name: "My Song" })).toBeTruthy();
		expect(getByText(MY_SLUG)).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([MY_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(MY_SLUG);
		// Auto-add should be called with the owner id as the request shape
		expect(mockAutoAdd).toHaveBeenCalledWith({ followed_user_id: "owner-1" }, expect.any(Function));
		cleanup();
	});

	it("shows Song not found when songPublic is empty or invalid", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: NO_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic: {} });
		installStoreMocks(mockAdd, mockGet);

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		expect(matches.length).toBeGreaterThanOrEqual(MIN_ONE);
		expect(matches[FIRST_INDEX]).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([NO_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(NO_SLUG);
		cleanup();
	});

	// Whitespace-only slug should be treated as missing; ensure no store selectors are invoked
	it("does not call addActivePublicSongSlugs when slug is only whitespace", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: WHITESPACE_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn().mockReturnValue(undefined);
		installStoreMocks(mockAdd, mockGet);

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		const EXPECTED_MATCHES = 1;
		expect(matches.length).toBeGreaterThanOrEqual(EXPECTED_MATCHES);
		expect(mockAdd).not.toHaveBeenCalled();
		expect(mockGet).not.toHaveBeenCalled();
	});
});
