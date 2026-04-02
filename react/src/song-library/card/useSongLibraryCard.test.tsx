import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import useLocale, { type UseLocaleResult } from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { SongLibraryEntry } from "../slice/song-library-types";
import makeSongLibraryEntry from "../test-utils/makeSongLibraryEntry.mock";
import useSongLibraryCard from "./useSongLibraryCard";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");

const TEST_SONG_ID = "song-123";
const TEST_SLUG = "my-song";
const TEST_USER_ID = "user-123";
const TEST_VIEW_PATH = `/es/song/${TEST_SLUG}`;
const TEST_EDIT_PATH = `/en/dashboard/song-edit/${TEST_SONG_ID}`;

function installLocale(lang: UseLocaleResult["lang"]): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<UseLocaleResult>({
			lang,
			t: vi.fn(),
		}),
	);
}

/**
 * Harness that documents how `useSongLibraryCard()` is consumed from UI code.
 *
 * @param entry - Entry passed into the hook for derived paths and actions.
 * @returns A small DOM surface exposing hook values and handlers.
 */
function Harness({ entry }: { entry: SongLibraryEntry }): ReactElement {
	const { currentUserId, handleEditSongClick, handleRemoveSongClick, viewPath } =
		useSongLibraryCard({
			entry,
		});

	return (
		<div>
			<div data-testid="current-user-id">{currentUserId ?? ""}</div>
			<div data-testid="view-path">{viewPath}</div>
			<button type="button" data-testid="edit-button" onClick={handleEditSongClick}>
				edit
			</button>
			<button type="button" data-testid="remove-button" onClick={handleRemoveSongClick}>
				remove
			</button>
		</div>
	);
}

describe("useSongLibraryCard — renderHook", () => {
	it("returns the current user id and localized view path", () => {
		resetAllSlices();
		vi.resetAllMocks();

		const navigateMock = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigateMock);
		installLocale("es");
		useAppStore.setState({
			userSessionData: forceCast({
				user: { user_id: TEST_USER_ID },
			}),
		});

		const entry = makeSongLibraryEntry({
			song_id: TEST_SONG_ID,
			song_slug: TEST_SLUG,
		});

		const { result } = renderHook(() => useSongLibraryCard({ entry }));

		expect(result.current.currentUserId).toBe(TEST_USER_ID);
		expect(result.current.viewPath).toBe(TEST_VIEW_PATH);
	});

	it("handleEditSongClick navigates to the localized edit path", () => {
		resetAllSlices();
		vi.resetAllMocks();

		const navigateMock = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigateMock);
		installLocale("en");

		const entry = makeSongLibraryEntry({
			song_id: TEST_SONG_ID,
			song_slug: TEST_SLUG,
		});

		const { result } = renderHook(() => useSongLibraryCard({ entry }));

		result.current.handleEditSongClick();

		expect(navigateMock).toHaveBeenCalledWith(TEST_EDIT_PATH);
	});

	it("handleRemoveSongClick calls removeSongFromSongLibrary with the song id", () => {
		resetAllSlices();
		vi.resetAllMocks();

		const navigateMock = vi.fn();
		const removeSongFromSongLibrary = vi.fn(() => Effect.sync(() => undefined));
		vi.mocked(useNavigate).mockReturnValue(navigateMock);
		installLocale("en");
		useAppStore.setState({
			removeSongFromSongLibrary,
		});

		const entry = makeSongLibraryEntry({
			song_id: TEST_SONG_ID,
			song_slug: TEST_SLUG,
		});

		const { result } = renderHook(() => useSongLibraryCard({ entry }));

		result.current.handleRemoveSongClick();

		expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: TEST_SONG_ID });
	});
});

describe("useSongLibraryCard — Harness", () => {
	it("renders derived values for UI usage", () => {
		cleanup();
		resetAllSlices();
		vi.resetAllMocks();

		const navigateMock = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigateMock);
		installLocale("es");
		useAppStore.setState({
			userSessionData: forceCast({
				user: { user_id: TEST_USER_ID },
			}),
		});

		const entry = makeSongLibraryEntry({
			song_id: TEST_SONG_ID,
			song_slug: TEST_SLUG,
		});

		render(<Harness entry={entry} />);

		expect(screen.getByTestId("current-user-id").textContent).toBe(TEST_USER_ID);
		expect(screen.getByTestId("view-path").textContent).toBe(TEST_VIEW_PATH);
	});

	it("wires edit and remove handlers into DOM events", () => {
		cleanup();
		resetAllSlices();
		vi.resetAllMocks();

		const navigateMock = vi.fn();
		const removeSongFromSongLibrary = vi.fn(() => Effect.sync(() => undefined));
		vi.mocked(useNavigate).mockReturnValue(navigateMock);
		installLocale("en");
		useAppStore.setState({
			removeSongFromSongLibrary,
		});

		const entry = makeSongLibraryEntry({
			song_id: TEST_SONG_ID,
			song_slug: TEST_SLUG,
		});

		render(<Harness entry={entry} />);

		fireEvent.click(screen.getByTestId("edit-button"));
		fireEvent.click(screen.getByTestId("remove-button"));

		expect(navigateMock).toHaveBeenCalledWith(TEST_EDIT_PATH);
		expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: TEST_SONG_ID });
	});
});
