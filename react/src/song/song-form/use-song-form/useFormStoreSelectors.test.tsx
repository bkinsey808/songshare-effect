import { render, renderHook, screen } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongPublic } from "@/react/song/song-schema";

import useFormStoreSelectors from "./useFormStoreSelectors";

vi.mock("@/react/app-store/useAppStore");

// --- Helpers ---

/**
 * Install a mocked app store implementation for tests.
 *
 * @param overrides - Optional fake state overrides
 * @returns void
 */
function installStore(overrides: Record<string, unknown> = {}): void {
	vi.resetAllMocks();
	const fakeState = {
		addActivePrivateSongIds: vi.fn(() => Effect.void),
		addActivePublicSongIds: vi.fn(() => Effect.void),
		addOrUpdatePublicSongs: vi.fn(),
		removeActivePrivateSongIds: vi.fn(),
		removeActivePublicSongIds: vi.fn(),
		removeSongsFromCache: vi.fn(),
		removeSongLibraryEntry: vi.fn(),
		addSongLibraryEntry: vi.fn(),
		privateSongs: {},
		publicSongs: {},
		userSessionData: undefined,
		...overrides,
	};
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof fakeState) => unknown>(selector)(fakeState),
	);
}

// --- Tests ---

describe("useFormStoreSelectors", () => {
	describe("useFormStoreSelectors — renderHook", () => {
		it("returns all store selectors and state values", () => {
			// Arrange + Act
			installStore();
			const { result } = renderHook(() => useFormStoreSelectors());

			// Assert
			expect({
				addActivePrivateSongIds: typeof result.current.addActivePrivateSongIds,
				addActivePublicSongIds: typeof result.current.addActivePublicSongIds,
				addOrUpdatePublicSongs: typeof result.current.addOrUpdatePublicSongs,
				removeActivePrivateSongIds: typeof result.current.removeActivePrivateSongIds,
				privateSongs: result.current.privateSongs,
				publicSongs: result.current.publicSongs,
				currentUserId: result.current.currentUserId,
			}).toStrictEqual({
				addActivePrivateSongIds: "function",
				addActivePublicSongIds: "function",
				addOrUpdatePublicSongs: "function",
				removeActivePrivateSongIds: "function",
				privateSongs: {},
				publicSongs: {},
				currentUserId: undefined,
			});
		});

		it("returns initialized songs objects", () => {
			// Arrange
			const mockPrivateSongs = { song1: {} };
			const mockPublicSongs = { song2: {} };
			installStore({
				privateSongs: mockPrivateSongs,
				publicSongs: mockPublicSongs,
			});

			// Act
			const { result: result2 } = renderHook(() => useFormStoreSelectors());

			// Assert
			expect(result2.current.privateSongs).toBe(mockPrivateSongs);
			expect(result2.current.publicSongs).toBe(mockPublicSongs);
		});

		it("returns callable action methods that delegate to store", () => {
			// Arrange
			const addOrUpdatePublicSongs = vi.fn();
			const removeActivePrivateSongIds = vi.fn();
			installStore({
				addOrUpdatePublicSongs,
				removeActivePrivateSongIds,
			});

			// Act
			const { result: result3 } = renderHook(() => useFormStoreSelectors());
			const mockSong = forceCast<SongPublic>({
				song_id: "song-1",
				song_name: "Test",
				song_slug: "test",
				lyrics: [],
				script: [],
				translations: [],
				slides: {},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				slide_order: [],
				user_id: "user-1",
			});
			result3.current.addOrUpdatePublicSongs({ song1: mockSong });
			result3.current.removeActivePrivateSongIds(["song-1"]);

			// Assert
			expect(addOrUpdatePublicSongs).toHaveBeenCalledWith({ song1: mockSong });
			expect(removeActivePrivateSongIds).toHaveBeenCalledWith(["song-1"]);
		});
	});

	describe("useFormStoreSelectors — Harness", () => {
		const EXPECTED_CALL_COUNT = 1;

		/**
		 * Harness for useFormStoreSelectors.
		 *
		 * Shows how useFormStoreSelectors integrates into a real component:
		 * - Displays current songs from store
		 * - Wires up action methods to buttons
		 *
		 * @returns A small DOM fragment used by the harness test
		 */
		function Harness(): ReactElement {
			const {
				privateSongs,
				publicSongs,
				addOrUpdatePublicSongs,
				removeActivePrivateSongIds,
				addActivePrivateSongIds,
				addActivePublicSongIds,
				removeActivePublicSongIds,
				removeSongsFromCache,
				removeSongLibraryEntry,
				addSongLibraryEntry,
				currentUserId,
			} = useFormStoreSelectors();

			return (
				<div>
					<div data-testid="private-songs-count">{Object.keys(privateSongs).length}</div>
					<div data-testid="public-songs-count">{Object.keys(publicSongs).length}</div>
					<div data-testid="current-user-id">{currentUserId}</div>

					<button
						type="button"
						data-testid="add-public-song"
						onClick={() => {
							addOrUpdatePublicSongs({
								test: forceCast<SongPublic>({
									song_id: "test",
									song_name: "Test",
									song_slug: "test",
									lyrics: [],
									script: [],
									translations: [],
									slides: {},
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
									slide_order: [],
									user_id: "user-1",
								}),
							});
						}}
					>
						Add Public Song
					</button>

					<button
						type="button"
						data-testid="remove-private-songs"
						onClick={() => {
							removeActivePrivateSongIds(["song-1", "song-2"]);
						}}
					>
						Remove Private Songs
					</button>

					<button
						type="button"
						data-testid="add-active-private"
						onClick={() => {
							void addActivePrivateSongIds(["song-1"]);
						}}
					>
						Add Active Private
					</button>

					<button
						type="button"
						data-testid="add-active-public"
						onClick={() => {
							void addActivePublicSongIds(["song-2"]);
						}}
					>
						Add Active Public
					</button>

					<button
						type="button"
						data-testid="remove-active-public"
						onClick={() => {
							removeActivePublicSongIds(["song-2"]);
						}}
					>
						Remove Active Public
					</button>

					<button
						type="button"
						data-testid="remove-cache"
						onClick={() => {
							removeSongsFromCache(["song-1"]);
						}}
					>
						Remove Cache
					</button>

					<button
						type="button"
						data-testid="remove-library"
						onClick={() => {
							removeSongLibraryEntry("song-1");
						}}
					>
						Remove Library
					</button>

					<button
						type="button"
						data-testid="add-library"
						onClick={() => {
							addSongLibraryEntry({
								song_id: "test",
								user_id: "user-1",
								song_owner_id: "user-1",
								created_at: new Date().toISOString(),
								song_name: "Test",
								song_slug: "test",
							});
						}}
					>
						Add Library
					</button>
				</div>
			);
		}

		it("displays song counts and user id from store", () => {
			// Arrange
			const mockPrivateSongs = { song1: {}, song2: {} };
			const mockPublicSongs = { song3: {} };
			installStore({
				privateSongs: mockPrivateSongs,
				publicSongs: mockPublicSongs,
				userSessionData: { user: { user_id: "user-123" } },
			});

			// Act
			render(<Harness />);

			// Assert
			expect(screen.getByTestId("private-songs-count").textContent).toBe("2");
			expect(screen.getByTestId("public-songs-count").textContent).toBe("1");
			expect(screen.getByTestId("current-user-id").textContent).toBe("user-123");
		});

		it("calls addOrUpdatePublicSongs when button clicked", () => {
			// Arrange
			const addOrUpdatePublicSongs = vi.fn();
			installStore({ addOrUpdatePublicSongs });

			// Act
			render(<Harness />);
			screen.getByTestId("add-public-song").click();

			// Assert
			expect(addOrUpdatePublicSongs).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
		});

		it("calls removeActivePrivateSongIds when button clicked", () => {
			// Arrange
			const removeActivePrivateSongIds = vi.fn();
			installStore({ removeActivePrivateSongIds });

			// Act
			render(<Harness />);
			screen.getByTestId("remove-private-songs").click();

			// Assert
			expect(removeActivePrivateSongIds).toHaveBeenCalledWith(["song-1", "song-2"]);
		});

		it("calls addActivePrivateSongIds when button clicked", () => {
			// Arrange
			const addActivePrivateSongIds = vi.fn(() => Effect.void);
			installStore({ addActivePrivateSongIds });

			// Act
			render(<Harness />);
			screen.getByTestId("add-active-private").click();

			// Assert
			expect(addActivePrivateSongIds).toHaveBeenCalledWith(["song-1"]);
		});

		it("calls addActivePublicSongIds when button clicked", () => {
			// Arrange
			const addActivePublicSongIds = vi.fn(() => Effect.void);
			installStore({ addActivePublicSongIds });

			// Act
			render(<Harness />);
			screen.getByTestId("add-active-public").click();

			// Assert
			expect(addActivePublicSongIds).toHaveBeenCalledWith(["song-2"]);
		});

		it("calls removeActivePublicSongIds when button clicked", () => {
			// Arrange
			const removeActivePublicSongIds = vi.fn();
			installStore({ removeActivePublicSongIds });

			// Act
			render(<Harness />);
			screen.getByTestId("remove-active-public").click();

			// Assert
			expect(removeActivePublicSongIds).toHaveBeenCalledWith(["song-2"]);
		});

		it("calls removeSongsFromCache when button clicked", () => {
			// Arrange
			const removeSongsFromCache = vi.fn();
			installStore({ removeSongsFromCache });

			// Act
			render(<Harness />);
			screen.getByTestId("remove-cache").click();

			// Assert
			expect(removeSongsFromCache).toHaveBeenCalledWith(["song-1"]);
		});

		it("calls removeSongLibraryEntry when button clicked", () => {
			// Arrange
			const removeSongLibraryEntry = vi.fn();
			installStore({ removeSongLibraryEntry });

			// Act
			render(<Harness />);
			screen.getByTestId("remove-library").click();

			// Assert
			expect(removeSongLibraryEntry).toHaveBeenCalledWith("song-1");
		});

		it("calls addSongLibraryEntry when button clicked", () => {
			// Arrange
			const addSongLibraryEntry = vi.fn();
			installStore({ addSongLibraryEntry });

			// Act
			render(<Harness />);
			screen.getByTestId("add-library").click();

			// Assert
			expect(addSongLibraryEntry).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
		});
	});
});
