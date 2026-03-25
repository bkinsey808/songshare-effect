import { cleanup, render, renderHook, waitFor, within } from "@testing-library/react";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import fetchEventsByTagRequest from "@/react/tag-library/event/fetchEventsByTagRequest";
import fetchImagesByTagRequest from "@/react/tag-library/image/fetchImagesByTagRequest";
import fetchPlaylistsByTagRequest from "@/react/tag-library/playlist/fetchPlaylistsByTagRequest";
import fetchSongsByTagRequest from "@/react/tag-library/song/fetchSongsByTagRequest";

import useTagView from "./useTagView";

vi.mock("react-router-dom");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/tag-library/image/fetchImagesByTagRequest");
vi.mock("@/react/tag-library/song/fetchSongsByTagRequest");
vi.mock("@/react/tag-library/playlist/fetchPlaylistsByTagRequest");
vi.mock("@/react/tag-library/event/fetchEventsByTagRequest");

const TAG_SLUG = "test";
const USER_ID = "usr-1";
const IMAGE_ID = "img-1";

function makeEntry(): ImageLibraryEntry {
	return {
		user_id: USER_ID,
		image_id: IMAGE_ID,
		created_at: "2026-01-01T00:00:00Z",
	};
}

function mockAllFetchesEmpty(): void {
	vi.mocked(fetchImagesByTagRequest).mockResolvedValue({ ok: true, entries: [] });
	vi.mocked(fetchSongsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
	vi.mocked(fetchPlaylistsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
	vi.mocked(fetchEventsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
}

/**
 * Harness for useTagView — "Documentation by Harness".
 *
 * Shows how useTagView integrates into a tag view page:
 * - Loading indicator while fetching
 * - Image entries list after successful fetch
 * - Error message on failure
 */
function Harness(): ReactElement {
	const { currentUserId, imageEntries, error, isLoading, tag_slug } = useTagView();

	return (
		<div data-testid="harness">
			<div data-testid="tag-slug">{tag_slug ?? ""}</div>
			<div data-testid="current-user-id">{currentUserId ?? ""}</div>
			<div data-testid="is-loading">{String(isLoading)}</div>
			{error !== undefined && <div data-testid="error">{error}</div>}
			<ul data-testid="entries">
				{imageEntries.map((entry) => (
					<li key={entry.image_id} data-testid={`entry-${entry.image_id}`}>
						{entry.image_id}
					</li>
				))}
			</ul>
		</div>
	);
}

describe("useTagView — Harness", () => {
	it("shows loading then entries on successful fetch", async () => {
		cleanup();
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const entry = makeEntry();
		vi.mocked(fetchImagesByTagRequest).mockResolvedValue({ ok: true, entries: [entry] });
		vi.mocked(fetchSongsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchPlaylistsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchEventsByTagRequest).mockResolvedValue({ ok: true, entries: [] });

		const { container } = render(<Harness />);

		await waitFor(() => {
			expect(forceCast<HTMLElement>(within(container).getByTestId("is-loading")).textContent).toBe(
				"false",
			);
		});

		expect(
			forceCast<HTMLElement>(within(container).getByTestId(`entry-${IMAGE_ID}`)).textContent,
		).toContain(IMAGE_ID);
	});

	it("shows error when fetch fails", async () => {
		cleanup();
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		vi.mocked(fetchImagesByTagRequest).mockResolvedValue({
			ok: false,
			error: "Failed to load images for this tag.",
		});
		vi.mocked(fetchSongsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchPlaylistsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchEventsByTagRequest).mockResolvedValue({ ok: true, entries: [] });

		const { container } = render(<Harness />);

		await waitFor(() => {
			expect(forceCast<HTMLElement>(within(container).getByTestId("is-loading")).textContent).toBe(
				"false",
			);
		});

		expect(forceCast<HTMLElement>(within(container).getByTestId("error")).textContent).toBe(
			"Failed to load images for this tag.",
		);
	});
});

describe("useTagView — renderHook", () => {
	it("when tag_slug is undefined: sets isLoading false, no fetch", async () => {
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		const { result } = renderHook(() => useTagView());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(fetchImagesByTagRequest).not.toHaveBeenCalled();
		expect(result.current.imageEntries).toStrictEqual([]);
		expect(result.current.error).toBeUndefined();
		expect(result.current.tag_slug).toBeUndefined();
	});

	it("calls fetchImagesByTagRequest with the tag slug", async () => {
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		mockAllFetchesEmpty();

		renderHook(() => useTagView());

		await waitFor(() => {
			expect(fetchImagesByTagRequest).toHaveBeenCalledWith(TAG_SLUG);
		});
	});

	it("populates imageEntries on success", async () => {
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		const entry = makeEntry();
		vi.mocked(fetchImagesByTagRequest).mockResolvedValue({ ok: true, entries: [entry] });
		vi.mocked(fetchSongsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchPlaylistsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchEventsByTagRequest).mockResolvedValue({ ok: true, entries: [] });

		const { result } = renderHook(() => useTagView());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.imageEntries).toStrictEqual([entry]);
		expect(result.current.error).toBeUndefined();
	});

	it("sets error on failure", async () => {
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		vi.mocked(fetchImagesByTagRequest).mockResolvedValue({
			ok: false,
			error: "Failed to load images for this tag.",
		});
		vi.mocked(fetchSongsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchPlaylistsByTagRequest).mockResolvedValue({ ok: true, entries: [] });
		vi.mocked(fetchEventsByTagRequest).mockResolvedValue({ ok: true, entries: [] });

		const { result } = renderHook(() => useTagView());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.error).toBe("Failed to load images for this tag.");
		expect(result.current.imageEntries).toStrictEqual([]);
	});

	it("forwards currentUserId from useCurrentUserId", () => {
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		mockAllFetchesEmpty();

		const { result } = renderHook(() => useTagView());

		expect(result.current.currentUserId).toBe(USER_ID);
	});

	it("forwards tag_slug from useParams", () => {
		vi.resetAllMocks();
		vi.mocked(useParams).mockReturnValue({ tag_slug: TAG_SLUG });
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		mockAllFetchesEmpty();

		const { result } = renderHook(() => useTagView());

		expect(result.current.tag_slug).toBe(TAG_SLUG);
	});
});
