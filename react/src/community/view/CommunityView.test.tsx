import { render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Button from "@/react/lib/design-system/Button";
import ShareButton from "@/react/lib/design-system/ShareButton";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import forceCast from "@/react/lib/test-utils/forceCast";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import CommunityView from "./CommunityView";
import useCommunityView, { type UseCommunityViewReturn } from "./useCommunityView";

vi.mock("react-i18next");
vi.mock("@/react/lib/design-system/Button");
vi.mock("@/react/lib/design-system/ShareButton");
vi.mock("@/react/lib/language/useCurrentLang");
vi.mock("@/shared/language/buildPathWithLang");
vi.mock("./useCommunityView");

vi.mocked(useTranslation).mockReturnValue(
	forceCast({
		t: (_key: string, fallback?: string): string => fallback ?? "",
		i18n: forceCast({}),
	}),
);

vi.mocked(Button).mockImplementation(
	({
		children,
		onClick,
		disabled,
	}: {
		children: ReactElement | string;
		onClick?: () => void;
		disabled?: boolean;
	}): ReactElement => (
		<button type="button" onClick={onClick} disabled={disabled}>
			{children}
		</button>
	),
);

vi.mocked(ShareButton).mockImplementation((): ReactElement => <button type="button">Share</button>);
vi.mocked(useCurrentLang).mockReturnValue("en");
vi.mocked(buildPathWithLang).mockImplementation(
	(path: string, lang: string): string => `/${lang}${path}`,
);

function makeView(overrides: Partial<UseCommunityViewReturn> = {}): UseCommunityViewReturn {
	return {
		currentCommunity: {
			community_id: "community-1",
			owner_id: "owner-1",
			name: "Test Community",
			slug: "test-community",
			description: "A community for testing",
			is_public: true,
			public_notes: "Public notes",
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
		},
		members: [],
		communityEvents: [],
		communitySongs: [],
		communityPlaylists: [],
		availableSongOptions: [],
		availablePlaylistOptions: [],
		activeEventId: undefined,
		isCommunityLoading: false,
		communityError: undefined,
		isMember: false,
		isOwner: false,
		isJoinLoading: false,
		isLeaveLoading: false,
		canManage: false,
		canEdit: false,
		onJoinClick: vi.fn(),
		onLeaveClick: vi.fn(),
		onManageClick: vi.fn(),
		onEditClick: vi.fn(),
		onShareSongClick: vi.fn(),
		onSharePlaylistClick: vi.fn(),
		userSession: undefined,
		...overrides,
	};
}

describe("communityView", () => {
	it("renders community songs and playlists on the public view", () => {
		vi.mocked(useCommunityView).mockReturnValue(
			forceCast<UseCommunityViewReturn>(
				makeView({
					communitySongs: [
						{
							community_id: "community-1",
							song_id: "song-1",
							created_at: "2026-01-02T00:00:00Z",
							song_name: "Song One",
							song_slug: "song-one",
						},
					],
					communityPlaylists: [
						{
							community_id: "community-1",
							playlist_id: "playlist-1",
							created_at: "2026-01-03T00:00:00Z",
							playlist_name: "Playlist One",
							playlist_slug: "playlist-one",
						},
					],
				}),
			),
		);

		render(
			<MemoryRouter>
				<CommunityView />
			</MemoryRouter>,
		);

		expect(screen.getByRole("heading", { name: "Songs" })).toBeTruthy();
		expect(screen.getByText("Song One")).toBeTruthy();
		expect(screen.getByRole("link", { name: "Go to Song" }).getAttribute("href")).toBe(
			"/en/songs/song-one",
		);
		expect(screen.getByRole("heading", { name: "Playlists" })).toBeTruthy();
		expect(screen.getByText("Playlist One")).toBeTruthy();
		expect(screen.getByRole("link", { name: "Go to Playlist" }).getAttribute("href")).toBe(
			"/en/playlists/playlist-one",
		);
	});
});
