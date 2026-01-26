import { renderHook } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { useAppStoreSelector } from "@/react/zustand/useAppStore";

import { type SongPublic } from "../song-schema";
import { useSongView } from "./useSongView";

vi.mock("react-router-dom");
vi.mock("@/react/zustand/useAppStore");

const VALID_SLUG = "valid-slug";
const EMPTY_SLUG = "";
const WHITESPACE_SLUG = "   ";
const INVALID_SLUG = "invalid-slug";

function makeValidSongPublic(overrides: Partial<SongPublic> = {}): SongPublic {
	return {
		song_id: "s1",
		song_name: "Test Song",
		song_slug: VALID_SLUG,
		fields: ["lyrics"],
		slide_order: ["slide-1"],
		slides: {
			"slide-1": { slide_name: "Verse 1", field_data: { lyrics: "Hello world" } },
		},
		// eslint-disable-next-line unicorn/no-null -- schema requires null for nullable DB fields
		key: null,
		// eslint-disable-next-line unicorn/no-null -- schema requires null for nullable DB fields
		scale: null,
		user_id: "u1",
		// eslint-disable-next-line unicorn/no-null -- schema requires null for nullable DB fields
		short_credit: null,
		// eslint-disable-next-line unicorn/no-null -- schema requires null for nullable DB fields
		long_credit: null,
		// eslint-disable-next-line unicorn/no-null -- schema requires null for nullable DB fields
		public_notes: null,
		created_at: "2025-01-01T00:00:00Z",
		updated_at: "2025-01-01T00:00:00Z",
		...overrides,
	};
}

function installStoreMocks(mockAdd: unknown, mockGet: unknown): void {
	vi.mocked(useAppStoreSelector).mockImplementation((selector: unknown) => {
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
