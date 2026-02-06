import { renderHook } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type addUserToLibraryClient from "@/react/user-library/addUserClient";

import useAppStore from "@/react/app-store/useAppStore";
import makeSongPublic from "@/react/test-utils/makeSongPublic";

import { type SongPublic } from "../song-schema";
import { useSongView } from "./useSongView";

vi.mock("react-router-dom");
// Mock the store module so tests can set implementations
vi.mock("@/react/app-store/useAppStore");
// Stub networked client used by the hook to avoid noisy runtime warnings
vi.mock("@/react/user-library/addUserClient", (): { default: typeof addUserToLibraryClient } => ({
	default: vi.fn().mockResolvedValue(undefined),
}));

const VALID_SLUG = "valid-slug";
const EMPTY_SLUG = "";
const WHITESPACE_SLUG = "   ";
const INVALID_SLUG = "invalid-slug";

function makeValidSongPublic(overrides: Partial<SongPublic> = {}): SongPublic {
	return makeSongPublic({ song_slug: VALID_SLUG, ...overrides });
}

function installStoreMocks(mockAdd: unknown, mockGet: unknown): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const selectorText = String(selector);
		if (selectorText.includes("addActivePublicSongSlugs")) {
			return mockAdd;
		}
		if (selectorText.includes("getSongBySlug")) {
			return mockGet;
		}
		return undefined;
	});
}

describe("useSongView", () => {
	it("returns not found when no song_slug in params", () => {
		vi.mocked(useParams).mockReturnValue({});
		const mockAdd = vi.fn();
		const mockGet = vi.fn();
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).not.toHaveBeenCalled();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it("returns not found when song_slug is empty string", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: EMPTY_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn();
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).not.toHaveBeenCalled();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it("returns not found when song_slug is whitespace", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: WHITESPACE_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn();
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).not.toHaveBeenCalled();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it("returns not found when getSongBySlug returns undefined", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: INVALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn().mockReturnValue(undefined);
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toBeUndefined();
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).toHaveBeenCalledWith([INVALID_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(INVALID_SLUG);
	});

	it("returns not found when songPublic is undefined", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: VALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic: undefined });
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toStrictEqual({ song: {}, songPublic: undefined });
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).toHaveBeenCalledWith([VALID_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(VALID_SLUG);
	});

	it("returns found when songPublic decodes successfully", () => {
		const songPublic = makeValidSongPublic();
		vi.mocked(useParams).mockReturnValue({ song_slug: VALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic });
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(false);
		expect(result.current.songData).toStrictEqual({ song: {}, songPublic });
		expect(result.current.songPublic).toStrictEqual(songPublic);
		expect(mockAdd).toHaveBeenCalledWith([VALID_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(VALID_SLUG);
	});

	it("returns not found when songPublic decode fails", () => {
		const invalidSongPublic = { invalid: true };
		vi.mocked(useParams).mockReturnValue({ song_slug: VALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic: invalidSongPublic });
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(result.current.isNotFound).toBe(true);
		expect(result.current.songData).toStrictEqual({ song: {}, songPublic: invalidSongPublic });
		expect(result.current.songPublic).toBeUndefined();
		expect(mockAdd).toHaveBeenCalledWith([VALID_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(VALID_SLUG);
	});

	it("throws when getSongBySlug throws", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: VALID_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn(() => {
			throw new Error("boom");
		});
		installStoreMocks(mockAdd, mockGet);

		expect(() => renderHook(() => useSongView())).toThrow("boom");
	});

	it("trims surrounding whitespace from slug before passing to store and decoding", () => {
		const padded = "  padded-slug  ";
		const trimmed = "padded-slug";
		vi.mocked(useParams).mockReturnValue({ song_slug: padded });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeValidSongPublic({ song_slug: trimmed });
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic });
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(mockAdd).toHaveBeenCalledWith([trimmed]);
		expect(mockGet).toHaveBeenCalledWith(trimmed);
		expect(result.current.songData).toStrictEqual({ song: {}, songPublic });
		expect(result.current.songPublic).toStrictEqual(songPublic);
		expect(result.current.isNotFound).toBe(false);
	});

	it("passes raw slug with surrounding whitespace to store functions", () => {
		const padded = "  padded-slug  ";
		vi.mocked(useParams).mockReturnValue({ song_slug: padded });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeValidSongPublic({ song_slug: padded.trim() });
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic });
		installStoreMocks(mockAdd, mockGet);

		const { result } = renderHook(() => useSongView());

		expect(mockAdd).toHaveBeenCalledWith([padded.trim()]);
		expect(mockGet).toHaveBeenCalledWith(padded.trim());
		expect(result.current.songData).toStrictEqual({ song: {}, songPublic });
		expect(result.current.songPublic).toStrictEqual(songPublic);
		expect(result.current.isNotFound).toBe(false);
	});
});
