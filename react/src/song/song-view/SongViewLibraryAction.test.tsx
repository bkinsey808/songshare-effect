import { render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";

import SongViewLibraryAction from "./SongViewLibraryAction";

vi.mock("react-i18next");
vi.mock("@/react/app-store/useAppStore");

/**
 * @param key - translation key
 * @param defaultVal - fallback value
 * @returns translated value or default
 */
function translateOrDefault(key: string, defaultVal?: string): string {
	return typeof defaultVal === "string" ? defaultVal : key;
}

const songPublic = makeSongPublic({
	song_id: "song-1",
	user_id: "owner-1",
	song_name: "Test Song",
	song_slug: "test-song",
});

type Overrides = {
	currentUserId?: string;
	isInSongLibrary?: boolean;
};

function installMocks(overrides: Overrides): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: translateOrDefault,
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);

	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorFn = forceCast<(state: Record<string, unknown>) => unknown>(selector);
		const userId =
			overrides.currentUserId !== undefined && overrides.currentUserId !== ""
				? overrides.currentUserId
				: undefined;
		const state = {
			userSessionData: userId === undefined ? undefined : { user: { user_id: userId } },
			isInSongLibrary: (_songId: string): boolean => overrides.isInSongLibrary ?? false,
			addSongToSongLibrary: (): Effect.Effect<void, Error> => Effect.succeed(undefined),
			removeSongFromSongLibrary: (): Effect.Effect<void, Error> => Effect.succeed(undefined),
			fetchSongLibrary: (): Effect.Effect<void, Error> => Effect.succeed(undefined),
		};
		return selectorFn(state);
	});
}

describe("songViewLibraryAction", () => {
	it("renders nothing when user is not signed in", () => {
		installMocks({});
		const { container } = render(<SongViewLibraryAction songPublic={songPublic} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders Add to library when song is not in library", async () => {
		installMocks({ currentUserId: "user-1", isInSongLibrary: false });
		render(<SongViewLibraryAction songPublic={songPublic} />);
		await waitFor(() => {
			expect(screen.getByTestId("song-view-add-to-library")).toBeTruthy();
		});
	});

	it("renders Remove from library when song is in library and user does not own it", async () => {
		installMocks({ currentUserId: "user-1", isInSongLibrary: true });
		render(<SongViewLibraryAction songPublic={songPublic} />);
		await waitFor(() => {
			expect(screen.getByTestId("song-view-remove-from-library")).toBeTruthy();
		});
	});
});
