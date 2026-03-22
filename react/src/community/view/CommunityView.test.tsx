import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Button from "@/react/lib/design-system/Button";
import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import forceCast from "@/react/lib/test-utils/forceCast";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import CommunityView from "./CommunityView";
import useCommunityView, { type UseCommunityViewReturn } from "./useCommunityView";

vi.mock("@/react/lib/design-system/Button");
vi.mock("@/react/lib/design-system/share-button/ShareButton");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/lib/qr-code/CollapsibleQrCode");
vi.mock("@/shared/language/buildPathWithLang");
vi.mock("./useCommunityView");

vi.mocked(useLocale).mockReturnValue(
	forceCast({
		lang: "en",
		t: (_key: string, fallback?: string): string => fallback ?? "",
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
vi.mocked(CollapsibleQrCode).mockImplementation((): ReactElement => <div data-testid="qr-code" />);
vi.mocked(buildPathWithLang).mockImplementation(
	(path: string, lang: string): string => `/${lang}${path}`,
);

/** Builds a UseCommunityViewReturn fixture with defaults; overrides allow per-test customization. */
function makeView(overrides: Partial<UseCommunityViewReturn> = {}): UseCommunityViewReturn {
	return {
		currentCommunity: {
			community_id: "community-1",
			owner_id: "owner-1",
			community_name: "Test Community",
			community_slug: "test-community",
			description: "A community for testing",
			is_public: true,
			public_notes: "Public notes",
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
		},
		members: [],
		selectedSongId: "",
		setSelectedSongId: vi.fn(),
		selectedPlaylistId: "",
		setSelectedPlaylistId: vi.fn(),
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
		onRefreshCommunity: vi.fn(),
		userSession: undefined,
		tags: [],
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
			"/en/song/song-one",
		);
		expect(screen.getByRole("heading", { name: "Playlists" })).toBeTruthy();
		expect(screen.getByText("Playlist One")).toBeTruthy();
		expect(screen.getByRole("link", { name: "Go to Playlist" }).getAttribute("href")).toBe(
			"/en/playlist/playlist-one",
		);
	});
});
