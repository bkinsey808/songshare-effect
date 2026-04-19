import { render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import deleteSongEffect from "./submit/deleteSongRequest";
import useSongFormDelete from "./useSongFormDelete";

vi.mock("react-router-dom");
vi.mock("./submit/deleteSongRequest");

const NAVIGATE_BACK = -1;

/**
 * Harness for useSongFormDelete.
 *
 * @param songId - The current song ID
 * @returns A small DOM fragment
 */
function Harness({ songId }: { readonly songId: string | undefined }): ReactElement {
	const { handleDelete } = useSongFormDelete({
		songId,
		removeActivePrivateSongIds: vi.fn(),
		removeActivePublicSongIds: vi.fn(),
		removeSongsFromCache: vi.fn(),
		removeSongLibraryEntry: vi.fn(),
	});

	return (
		<div>
			<button
				type="button"
				data-testid="delete-button"
				onClick={() => {
					void handleDelete();
				}}
			>
				Delete
			</button>
		</div>
	);
}

describe("useSongFormDelete", () => {
	describe("useSongFormDelete — renderHook", () => {
		it("handleDelete calls all cleanup actions and navigates back", async () => {
			// Arrange
			vi.clearAllMocks();
			const navigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(navigate);
			vi.mocked(deleteSongEffect).mockReturnValue(Effect.void);

			const removeActivePrivateSongIds = vi.fn();
			const removeActivePublicSongIds = vi.fn();
			const removeSongsFromCache = vi.fn();
			const removeSongLibraryEntry = vi.fn();

			const { result } = renderHook(() =>
				useSongFormDelete({
					songId: "song-123",
					removeActivePrivateSongIds,
					removeActivePublicSongIds,
					removeSongsFromCache,
					removeSongLibraryEntry,
				}),
			);

			// Act
			await result.current.handleDelete();

			// Assert
			await waitFor(() => {
				expect(deleteSongEffect).toHaveBeenCalledWith("song-123");
				expect(removeActivePrivateSongIds).toHaveBeenCalledWith(["song-123"]);
				expect(removeActivePublicSongIds).toHaveBeenCalledWith(["song-123"]);
				expect(removeSongsFromCache).toHaveBeenCalledWith(["song-123"]);
				expect(removeSongLibraryEntry).toHaveBeenCalledWith("song-123");
				expect(navigate).toHaveBeenCalledWith(NAVIGATE_BACK);
			});
		});

		it("handleDelete is a no-op if songId is undefined", async () => {
			// Arrange
			vi.clearAllMocks();
			const navigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(navigate);
			vi.mocked(deleteSongEffect).mockReturnValue(Effect.void);

			const { result } = renderHook(() =>
				useSongFormDelete({
					songId: undefined,
					removeActivePrivateSongIds: vi.fn(),
					removeActivePublicSongIds: vi.fn(),
					removeSongsFromCache: vi.fn(),
					removeSongLibraryEntry: vi.fn(),
				}),
			);

			// Act
			await result.current.handleDelete();

			// Assert
			expect(deleteSongEffect).not.toHaveBeenCalled();
			expect(navigate).not.toHaveBeenCalled();
		});
	});

	describe("useSongFormDelete — Harness", () => {
		it("harness renders and responds to delete click", async () => {
			// Arrange
			vi.clearAllMocks();
			const navigate = vi.fn();
			vi.mocked(useNavigate).mockReturnValue(navigate);
			vi.mocked(deleteSongEffect).mockReturnValue(Effect.void);

			// Act
			const rendered = render(<Harness songId="song-123" />);

			const button = rendered.getByTestId("delete-button");
			button.click();

			// Assert
			await waitFor(() => {
				expect(deleteSongEffect).toHaveBeenCalledWith("song-123");
			});
		});
	});
});
