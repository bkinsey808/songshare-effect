import { cleanup, render } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppStoreSelector } from "@/react/zustand/useAppStore";

import SongView from "./SongView";

vi.mock("react-router-dom");
vi.mock(
	"react-i18next",
	(): {
		useTranslation: () => {
			t: (key: string, defaultVal?: string | Record<string, unknown>) => string;
			i18n: { language: string };
		};
	} => ({
		useTranslation: (): {
			t: (key: string, defaultVal?: string | Record<string, unknown>) => string;
			i18n: { language: string };
		} => ({
			t: (key: string, defaultVal?: string | Record<string, unknown>): string =>
				typeof defaultVal === "string" ? defaultVal : key,
			i18n: { language: "en" },
		}),
	}),
);
vi.mock("@/react/zustand/useAppStore");

const NOT_FOUND_TEXT = "Song not found";
const MY_SLUG = "my-slug";
const NO_SLUG = "no-slug";
const WHITESPACE_SLUG = "   ";
const MIN_ONE = 1;
const FIRST_INDEX = 0;

function makeSongPublicLike(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		song_id: "s1",
		song_name: "My Song",
		song_slug: MY_SLUG,
		fields: ["lyrics"],
		slide_order: ["slide-1"],
		slides: {
			"slide-1": { slide_name: "Verse 1", field_data: { lyrics: "Hello world" } },
		},
		// songPublicSchema uses nullableStringSchema (string | null); undefined fails decode
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

describe("song view", () => {
	// eslint-disable-next-line jest/no-hooks -- cleanup for test isolation (avoid multiple SongView mounts in DOM)
	afterEach(cleanup);

	it("renders 'Song not found' when no song param is present", () => {
		vi.mocked(useParams).mockReturnValue({});
		installStoreMocks(vi.fn(), vi.fn());

		const { getByText } = render(<SongView />);

		expect(getByText(NOT_FOUND_TEXT)).toBeTruthy();
	});

	it("calls addActivePublicSongSlugs and displays song when valid songPublic is found", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const songPublic = makeSongPublicLike();
		const mockGet = vi.fn().mockReturnValue({ song: undefined, songPublic });
		installStoreMocks(mockAdd, mockGet);

		const { getByRole, getByText } = render(<SongView />);

		expect(getByRole("heading", { name: "My Song" })).toBeTruthy();
		expect(getByText(MY_SLUG)).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([MY_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(MY_SLUG);
	});

	it("shows Song not found when songPublic is empty or invalid", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: NO_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic: {} });
		installStoreMocks(mockAdd, mockGet);

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		expect(matches.length).toBeGreaterThanOrEqual(MIN_ONE);
		expect(matches[FIRST_INDEX]).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([NO_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(NO_SLUG);
	});

	it("does not call addActivePublicSongSlugs when slug is only whitespace", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: WHITESPACE_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn().mockReturnValue(undefined);
		installStoreMocks(mockAdd, mockGet);

		const { getAllByText } = render(<SongView />);

		const matches = getAllByText(NOT_FOUND_TEXT);
		const EXPECTED_MATCHES = 1;
		expect(matches.length).toBeGreaterThanOrEqual(EXPECTED_MATCHES);
		expect(mockAdd).not.toHaveBeenCalled();
		expect(mockGet).toHaveBeenCalledWith(WHITESPACE_SLUG);
	});
});
