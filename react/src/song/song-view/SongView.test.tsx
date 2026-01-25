import { render } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { useAppStoreSelector } from "@/react/zustand/useAppStore";

import SongView from "./SongView";

vi.mock("react-router-dom");

const NOT_FOUND_TEXT = "Song not found";
const VIEW_PREFIX = "Song View: ";
const UNKNOWN_TEXT = "Unknown";
const MY_SLUG = "my-slug";
const NO_SLUG = "no-slug";
const WHITESPACE_SLUG = "   ";

vi.mock("@/react/zustand/useAppStore");

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
	it("renders 'Song not found' when no song param is present", () => {
		vi.mocked(useParams).mockReturnValue({});
		// Provide a sane default store where selectors won't crash
		installStoreMocks(vi.fn(), vi.fn());

		const { getByText } = render(<SongView />);

		expect(getByText(NOT_FOUND_TEXT)).toBeTruthy();
	});

	it("calls addActivePublicSongSlugs and displays the song slug when found", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: MY_SLUG });
		const mockAdd = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic: { song_slug: MY_SLUG } });
		installStoreMocks(mockAdd, mockGet);

		const { getByText } = render(<SongView />);

		expect(getByText(`${VIEW_PREFIX}${MY_SLUG}`)).toBeTruthy();
		expect(mockAdd).toHaveBeenCalledWith([MY_SLUG]);
		expect(mockGet).toHaveBeenCalledWith(MY_SLUG);
	});

	it("displays Unknown when songPublic has no slug", () => {
		vi.mocked(useParams).mockReturnValue({ song_slug: NO_SLUG });
		const mockAdd = vi.fn();
		const mockGet = vi.fn().mockReturnValue({ song: {}, songPublic: {} });
		installStoreMocks(mockAdd, mockGet);

		const { getByText } = render(<SongView />);

		expect(getByText(`${VIEW_PREFIX}${UNKNOWN_TEXT}`)).toBeTruthy();
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
