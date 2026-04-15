import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";
import addUserToLibraryEffect from "@/react/user-library/user-add/addUserToLibraryEffect";

import { type SongPublic } from "../song-schema";
import { useSongView } from "./useSongView";

vi.mock("react-router-dom");
// Mock the store module so tests can set implementations
vi.mock("@/react/app-store/useAppStore");
// Stub networked effect used by the hook to avoid noisy runtime warnings
vi.mock("@/react/user-library/user-add/addUserToLibraryEffect");
// Avoid coupling useSongView tests to share subscription side effects
vi.mock("@/react/share/subscribe/useShareSubscription");

const VALID_SLUG = "valid-slug";
const EMPTY_SLUG = "";
const WHITESPACE_SLUG = "   ";
const INVALID_SLUG = "invalid-slug";

/**
 * Install a mocked `addUserToLibraryEffect` that is synchronous and no-op.
 *
 * @returns void
 */
function installEffectMock(): void {
	vi.mocked(addUserToLibraryEffect).mockReturnValue(Effect.sync(() => undefined));
}

/**
 * Create a valid `SongPublic` test fixture with an overridable shape.
 *
 * @param overrides - Partial fields to override on the generated `SongPublic`
 * @returns A `SongPublic` object suitable for tests
 */
function makeValidSongPublic(overrides: Partial<SongPublic> = {}): SongPublic {
	return makeSongPublic({ song_slug: VALID_SLUG, ...overrides });
}

/**
 * Install store selectors used by `useSongView` tests.
 *
 * @param mockAdd - Value to expose as `addActivePublicSongSlugs`
 * @param mockPublicSongs - Map of public songs to expose
 * @param mockPrivateSongs - Map of private songs to expose
 * @returns void
 */
function installStoreMocks(
	mockAdd: unknown,
	mockPublicSongs: Record<string, SongPublic> = {},
	mockPrivateSongs: Record<string, unknown> = {},
): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		if (typeof selector === "function") {
			const fakeState = {
				addActivePublicSongSlugs: mockAdd,
				publicSongs: mockPublicSongs,
				privateSongs: mockPrivateSongs,
				userSessionData: undefined,
			};
			return forceCast<(state: typeof fakeState) => unknown>(selector)(fakeState);
		}
		return undefined;
	});
}

describe("useSongView", () => {
	it("returns not found when no song_slug in params", () => {
		installEffectMock();
		vi.mocked(useParams).mockReturnValue({});
		const mockAdd = vi.fn();
		installStoreMocks(mockAdd);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it("returns not found when song_slug is empty string", () => {
		installEffectMock();
		vi.mocked(useParams).mockReturnValue({ song_slug: EMPTY_SLUG });
		const mockAdd = vi.fn();
		installStoreMocks(mockAdd);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it("returns not found when song_slug is whitespace", () => {
		installEffectMock();
		vi.mocked(useParams).mockReturnValue({ song_slug: WHITESPACE_SLUG });
		const mockAdd = vi.fn();
		installStoreMocks(mockAdd);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it("returns not found when slug is not in publicSongs", () => {
		installEffectMock();
		vi.mocked(useParams).mockReturnValue({ song_slug: INVALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		installStoreMocks(mockAdd);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).toHaveBeenCalledWith([INVALID_SLUG]);
	});

	it("returns not found when publicSongs entry fails schema validation", () => {
		installEffectMock();
		// Construct a value that has the right slug to be found but fails songPublicSchema.
		const invalidSong = forceCast<SongPublic>({ song_slug: VALID_SLUG, invalid: true });
		vi.mocked(useParams).mockReturnValue({ song_slug: VALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		installStoreMocks(mockAdd, { "fake-id": invalidSong });

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData?.songPublic).toStrictEqual(invalidSong);
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).toHaveBeenCalledWith([VALID_SLUG]);
	});

	it("returns found when songPublic decodes successfully", () => {
		installEffectMock();
		const songPublic = makeValidSongPublic();
		vi.mocked(useParams).mockReturnValue({ song_slug: VALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		installStoreMocks(mockAdd, { [songPublic.song_id]: songPublic });

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(false);
		expect(result.current.songData?.songPublic).toStrictEqual(songPublic);
		expect(result.current.songPublic).toStrictEqual(songPublic);
		expect(mockAdd).toHaveBeenCalledWith([VALID_SLUG]);
	});

	it("trims surrounding whitespace from slug before passing to store and decoding", () => {
		installEffectMock();
		const padded = "  padded-slug  ";
		const trimmed = "padded-slug";
		vi.mocked(useParams).mockReturnValue({ song_slug: padded });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeValidSongPublic({ song_slug: trimmed });
		installStoreMocks(mockAdd, { [songPublic.song_id]: songPublic });

		const { result } = renderHook(() => useSongView());

		expect(mockAdd).toHaveBeenCalledWith([trimmed]);
		expect(result.current.songData?.songPublic).toStrictEqual(songPublic);
		expect(result.current.songPublic).toStrictEqual(songPublic);
		expect(result.current.isNotFound).toBe(false);
	});
});
