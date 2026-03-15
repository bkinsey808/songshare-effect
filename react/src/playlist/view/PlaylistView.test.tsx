import { render } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import forceCast from "@/react/lib/test-utils/forceCast";
import SharedUsersSection from "@/react/share/shared-users-section/SharedUsersSection";

import PlaylistView from "./PlaylistView";
import usePlaylistView, { type UsePlaylistViewResult } from "./usePlaylistView";

vi.mock("react-i18next");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/lib/qr-code/CollapsibleQrCode");
vi.mock("@/react/lib/design-system/share-button/ShareButton");
vi.mock("@/react/share/shared-users-section/SharedUsersSection");
vi.mock("./usePlaylistView");

function installUiMocks(): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: (_key: string, fallback?: string): string => fallback ?? "",
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);
	vi.mocked(useLocale).mockReturnValue(forceCast<ReturnType<typeof useLocale>>({ lang: "en" }));
	vi.mocked(ShareButton).mockImplementation(() => <button type="button">Share</button>);
	vi.mocked(CollapsibleQrCode).mockImplementation(() => <div data-testid="qr-code" />);
	vi.mocked(SharedUsersSection).mockImplementation(() => <div data-testid="shared-users-mock" />);
}

function installPlaylistViewMock(overrides: Partial<UsePlaylistViewResult>): void {
	const base: UsePlaylistViewResult = {
		currentPlaylist: undefined,
		playlistPublic: undefined,
		publicSongs: {},
		isLoading: false,
		error: undefined,
		isOwner: false,
		songOrder: [],
	};
	vi.mocked(usePlaylistView).mockReturnValue({ ...base, ...overrides });
}

describe("playlist view", () => {
	it("renders not found when playlist is missing", () => {
		installUiMocks();
		installPlaylistViewMock({});

		const { getByText } = render(<PlaylistView />);

		expect(getByText("Playlist not found")).toBeTruthy();
	});

	it("renders playlist when data is available", () => {
		installUiMocks();
		installPlaylistViewMock({
			currentPlaylist: forceCast({
				playlist_id: "p1",
				user_id: "owner-123",
				owner_username: "owner",
				public: {
					playlist_name: "Test Playlist",
					playlist_slug: "test-playlist",
					song_order: [],
				},
			}),
			playlistPublic: forceCast({
				playlist_name: "Test Playlist",
				playlist_slug: "test-playlist",
				song_order: [],
			}),
		});

		const { getByRole } = render(<PlaylistView />);

		expect(getByRole("heading", { name: "Test Playlist" })).toBeTruthy();
	});
});
