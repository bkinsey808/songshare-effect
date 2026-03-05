import { render } from "@testing-library/react";
import { Effect } from "effect";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useAppStore from "@/react/app-store/useAppStore";
import { makeTestPlaylist } from "@/react/playlist/test-utils/makeTestPlaylist.mock";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";

import PlaylistPage from "./PlaylistPage";

vi.mock("react-router-dom");
vi.mock(
	"react-i18next",
	(): {
		useTranslation: () => {
			t: (key: string) => string;
			i18n: { language: string };
		};
	} => ({
		useTranslation: (): {
			t: (key: string) => string;
			i18n: { language: string };
		} => ({
			t: (key: string): string => key,
			i18n: { language: "en" },
		}),
	}),
);
vi.mock(
	"@/react/lib/language/locale/useLocale",
	(): { default: () => { lang: string } } => ({
		default: (): { lang: string } => ({ lang: "en" }),
	}),
);
vi.mock(
	"@/react/lib/design-system/ShareButton",
	(): { default: ({ children, ...props }: { children?: ReactNode }) => ReactElement } => ({
		default: ({ children, ...props }: { children?: ReactNode }): ReactElement => (
			<button {...props}>{children ?? "Share"}</button>
		),
	}),
);
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/user-library/user-add/addUserToLibraryEffect");
// oxlint-disable-next-line jest/no-untyped-mock-factory -- share hooks need simple mocks for unit test
vi.mock("@/react/auth/useCurrentUserId", () => ({ default: vi.fn() }));
// oxlint-disable-next-line jest/no-untyped-mock-factory -- share hooks need simple mocks for unit test
vi.mock("@/react/share/useShareSubscription", () => ({ default: vi.fn() }));
// oxlint-disable-next-line jest/no-untyped-mock-factory -- share hooks need simple mocks for unit test
vi.mock("@/react/share/SharedUsersSection", () => ({
	default: vi.fn(() => <div data-testid="shared-users-mock" />),
}));

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
		return undefined as unknown;
	});
}

describe("playlist page", () => {
	it("auto-adds playlist owner to user library when viewing playlist", () => {
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

		render(<PlaylistPage />);

		expect(mockAutoAdd).toHaveBeenCalledWith(
			{ followed_user_id: "owner-123" },
			expect.any(Function),
		);
	});
});
