import { render } from "@testing-library/react";
import { Effect } from "effect";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import ShareButton from "@/react/lib/design-system/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import { makeTestPlaylist } from "@/react/playlist/test-utils/makeTestPlaylist.mock";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";
import useShareSubscription from "@/react/share/subscribe/useShareSubscription";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";

import PlaylistView from "./PlaylistView";

vi.mock("react-router-dom");
vi.mock("react-i18next");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/lib/design-system/ShareButton");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/user-library/user-add/addUserToLibraryEffect");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/share/subscribe/useShareSubscription");
vi.mock("@/react/share/shared-users-section/SharedUsersSection");

function installUiMocks(): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: (key: string): string => key,
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);
	vi.mocked(useLocale).mockReturnValue(forceCast<ReturnType<typeof useLocale>>({ lang: "en" }));
	vi.mocked(ShareButton).mockImplementation(() => <button type="button">Share</button>);
	vi.mocked(useShareSubscription).mockImplementation(() => undefined);
	vi.mocked(SharedUsersSection).mockImplementation(() => <div data-testid="shared-users-mock" />);
}

function installStoreMocks(options: {
	mockFetch: unknown;
	mockClear: unknown;
	currentPlaylistReturn?: unknown;
	userId?: string;
}): void {
	const { mockFetch, mockClear, currentPlaylistReturn, userId } = options;
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorText = String(selector);
		if (selectorText.includes("currentPlaylist")) {
			return currentPlaylistReturn;
		}
		if (selectorText.includes("isPlaylistLoading")) {
			return false;
		}
		if (selectorText.includes("isPlaylistLibraryLoading")) {
			return false;
		}
		if (selectorText.includes("playlistError")) {
			return undefined;
		}
		if (selectorText.includes("fetchPlaylist")) {
			return mockFetch;
		}
		if (selectorText.includes("clearCurrentPlaylist")) {
			return mockClear;
		}
		if (selectorText.includes("userSessionData") && selectorText.includes("user_id")) {
			return userId;
		}
		if (selectorText.includes("userSessionData")) {
			return userId !== null && userId !== undefined && userId !== ""
				? { user: { user_id: userId } }
				: undefined;
		}
		if (selectorText.includes("isInPlaylistLibrary")) {
			return (_playlistId: string): boolean => false;
		}
		if (selectorText.includes("addPlaylistToLibrary")) {
			return (_request: unknown): Effect.Effect<void, Error> => Effect.succeed(undefined);
		}
		if (selectorText.includes("removePlaylistFromLibrary")) {
			return (_request: unknown): Effect.Effect<void, Error> => Effect.succeed(undefined);
		}
		if (selectorText.includes("fetchPlaylistLibrary")) {
			return (): Effect.Effect<void, Error> => Effect.succeed(undefined);
		}
		return undefined as unknown;
	});
}

describe("playlist view", () => {
	it("auto-adds playlist owner to user library when viewing playlist", () => {
		installUiMocks();
		// Mock useParams to return a playlist_slug
		vi.mocked(useParams).mockReturnValue({ playlist_slug: "test-playlist" });

		const mockFetch = vi.fn(() => Effect.succeed(undefined));
		const mockClear = vi.fn();
		// currentPlaylist has owner user_id = 'owner-123'
		const playlist = {
			...makeTestPlaylist(),
			playlist_id: "p1",
			user_id: "owner-123",
			public: { ...makeTestPlaylist().public, playlist_name: "Test" },
		};

		installStoreMocks({
			mockFetch,
			mockClear,
			currentPlaylistReturn: playlist,
			userId: "not-owner",
		});
		vi.mocked(useCurrentUserId).mockReturnValue("not-owner");

		const mockAutoAdd = vi.mocked(addUserToLibraryEffect);
		mockAutoAdd.mockReturnValue(Effect.sync(() => undefined));

		render(<PlaylistView />);

		expect(mockAutoAdd).toHaveBeenCalledWith(
			{ followed_user_id: "owner-123" },
			expect.any(Function),
		);
	});
});
