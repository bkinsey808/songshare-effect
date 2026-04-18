import { cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";

import useImageLibrary from "./useImageLibrary";
import useImageLibraryPage from "./useImageLibraryPage";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("./useImageLibrary");

const USER_ID = "usr-1";

/**
 * Install a mocked `useLocale` return value for tests.
 *
 * @returns void
 */
function installLocale(): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: (key: string) => key }),
	);
}

/**
 * Install a mocked `useImageLibrary` return value for tests.
 *
 * @param entries - Entries to return from the hook.
 * @param error - Optional error string returned by the hook.
 * @param isLoading - Whether the hook reports a loading state.
 * @returns void
 */
function installUseImageLibrary(opts: {
	entries?: ReturnType<typeof useImageLibrary>["entries"];
	error?: string | undefined;
	isLoading?: boolean;
}): void {
	vi.mocked(useImageLibrary).mockReturnValue({
		entries: opts.entries ?? [],
		error: opts.error,
		isLoading: opts.isLoading ?? false,
		removeFromImageLibrary: () => Effect.void,
	});
}

/**
 * Harness for useImageLibraryPage — "Documentation by Harness".
 *
 * Shows how useImageLibraryPage integrates into an image library page:
 * - Upload button for navigation
 * - Loading and error display
 * - List of entries
 *
 * @returns A small DOM tree used to exercise the hook in tests.
 */
function Harness(): ReactElement {
	const { currentUserId, entries, error, handleUploadClick, isLoading } = useImageLibraryPage();

	return (
		<div data-testid="harness">
			<div data-testid="current-user-id">{String(currentUserId ?? "")}</div>
			<div data-testid="is-loading">{String(isLoading)}</div>
			{error !== undefined && <span data-testid="error">{error}</span>}
			<ul data-testid="entries">
				{entries.map((entry) => (
					<li key={entry.image_id} data-testid={`entry-${entry.image_id}`}>
						{entry.image_id}
					</li>
				))}
			</ul>
			<button type="button" data-testid="upload-btn" onClick={handleUploadClick}>
				Upload
			</button>
		</div>
	);
}

describe("useImageLibraryPage — Harness", () => {
	it("shows initial state and exposes upload handler", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		installUseImageLibrary({ entries: [] });

		const { container } = render(<Harness />);

		expect(
			forceCast<HTMLElement>(within(container).getByTestId("current-user-id")).textContent,
		).toBe(USER_ID);
		expect(forceCast<HTMLElement>(within(container).getByTestId("is-loading")).textContent).toBe(
			"false",
		);
		expect(within(container).queryByTestId("error")).toBeNull();
	});

	it("navigates to upload path on upload click", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		installUseImageLibrary({});

		const { container } = render(<Harness />);
		fireEvent.click(within(container).getByTestId("upload-btn"));

		expect(mockNavigate).toHaveBeenCalledWith("/en/dashboard/image-upload");
	});
});

describe("useImageLibraryPage — renderHook", () => {
	it("returns entries and loading from useImageLibrary", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const mockEntries = [
			{
				user_id: USER_ID,
				image_id: "img-1",
				created_at: "2026-01-01T00:00:00Z",
			},
		];
		installUseImageLibrary({ entries: mockEntries });

		const { result } = renderHook(() => useImageLibraryPage());

		expect(result.current.entries).toStrictEqual(mockEntries);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeUndefined();
		expect(result.current.currentUserId).toBe(USER_ID);
	});

	it("returns error when useImageLibrary returns error", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		const errMsg = "Failed to load library";
		installUseImageLibrary({ error: errMsg });

		const { result } = renderHook(() => useImageLibraryPage());

		expect(result.current.error).toBe(errMsg);
	});
});
