import { cleanup, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImageLibraryEntry, RemoveImageFromLibraryRequest } from "./image-library-types";
import useImageLibrary from "./useImageLibrary";

vi.mock("react-router-dom");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/image/realtime/useImageLibraryPublicSubscription");

const IMAGE_ID = "img-1";
const USER_ID = "usr-1";

/**
 * Create a minimal `ImageLibraryEntry` for tests.
 *
 * @returns A test image library entry.
 */
function makeEntry(): ImageLibraryEntry {
	return {
		user_id: USER_ID,
		image_id: IMAGE_ID,
		created_at: "2026-01-01T00:00:00Z",
	};
}

/**
 * Install a mocked `useAppStore` implementation for tests.
 *
 * @param imageLibraryEntries - Seeded image library entries.
 * @param isImageLibraryLoading - Whether the image library is loading.
 * @param imageLibraryError - Optional error string for the image library.
 * @param fetchImageLibrary - Mocked fetchImageLibrary selector/effect.
 * @param subscribeToImageLibrary - Mocked subscribeToImageLibrary selector/effect.
 * @param removeImageFromLibrary - Mocked removeImageFromLibrary selector/effect.
 * @returns void
 */
function installStore(opts: {
	imageLibraryEntries?: Record<string, ImageLibraryEntry>;
	isImageLibraryLoading?: boolean;
	imageLibraryError?: string | undefined;
	fetchImageLibrary?: ReturnType<typeof vi.fn>;
	subscribeToImageLibrary?: ReturnType<typeof vi.fn>;
	removeImageFromLibrary?: ReturnType<typeof vi.fn>;
}): void {
	const {
		imageLibraryEntries = {},
		isImageLibraryLoading = false,
		imageLibraryError,
		fetchImageLibrary = vi.fn().mockReturnValue(Effect.succeed(undefined)),
		subscribeToImageLibrary = vi.fn().mockReturnValue(Effect.succeed(() => undefined)),
		removeImageFromLibrary = vi.fn().mockReturnValue(Effect.succeed(undefined)),
	} = opts;

	const mockState = {
		imageLibraryEntries,
		isImageLibraryLoading,
		imageLibraryError,
		fetchImageLibrary,
		subscribeToImageLibrary,
		removeImageFromLibrary,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}

/**
 * Test harness for `useImageLibrary` demonstrating DOM integration.
 *
 * Shows how `useImageLibrary` drives entries, loading, error display,
 * and remove actions in a simple image-library view.
 *
 * @returns A React element used by tests to assert rendering.
 */
function Harness(): ReactElement {
	const { entries, isLoading, error, removeFromImageLibrary } = useImageLibrary();

	return (
		<div data-testid="harness">
			<div data-testid="is-loading">{String(isLoading)}</div>
			{error !== undefined && <span data-testid="error">{error}</span>}
			<ul data-testid="entries">
				{entries.map((entry) => (
					<li key={entry.image_id} data-testid={`entry-${entry.image_id}`}>
						{entry.image_id}
						<button
							type="button"
							data-testid={`remove-${entry.image_id}`}
							onClick={() => {
								void Effect.runPromise(removeFromImageLibrary({ image_id: entry.image_id }));
							}}
						>
							Remove
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

describe("useImageLibrary — Harness", () => {
	it("shows entries from store", () => {
		cleanup();
		vi.resetAllMocks();
		vi.mocked(useLocation).mockReturnValue(
			forceCast<ReturnType<typeof useLocation>>({ pathname: "/dashboard/image-library" }),
		);
		const entry = makeEntry();
		installStore({ imageLibraryEntries: { [entry.image_id]: entry } });

		const { container } = render(<Harness />);

		expect(
			forceCast<HTMLElement>(within(container).getByTestId("entry-img-1")).textContent,
		).toContain(IMAGE_ID);
	});

	it("calls removeFromImageLibrary when remove button clicked", async () => {
		cleanup();
		vi.resetAllMocks();
		vi.mocked(useLocation).mockReturnValue(
			forceCast<ReturnType<typeof useLocation>>({ pathname: "/lib" }),
		);
		const mockRemove = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const entry = makeEntry();
		installStore({
			imageLibraryEntries: { [entry.image_id]: entry },
			removeImageFromLibrary: mockRemove,
		});

		const { container } = render(<Harness />);
		const removeBtn = within(container).getByTestId("remove-img-1");
		removeBtn.click();

		await waitFor(() => {
			expect(mockRemove).toHaveBeenCalledWith({ image_id: IMAGE_ID });
		});
	});
});

describe("useImageLibrary — renderHook", () => {
	it("returns entries as array from imageLibraryEntries", () => {
		vi.resetAllMocks();
		vi.mocked(useLocation).mockReturnValue(
			forceCast<ReturnType<typeof useLocation>>({ pathname: "/lib" }),
		);
		const entry = makeEntry();
		installStore({ imageLibraryEntries: { [entry.image_id]: entry } });

		const { result } = renderHook(() => useImageLibrary());

		expect(result.current.entries).toStrictEqual([entry]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeUndefined();
	});

	it("calls fetchImageLibrary and subscribeToImageLibrary on mount", async () => {
		vi.resetAllMocks();
		vi.mocked(useLocation).mockReturnValue(
			forceCast<ReturnType<typeof useLocation>>({ pathname: "/lib" }),
		);
		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const mockSubscribe = vi.fn().mockReturnValue(Effect.succeed(() => undefined));
		installStore({ fetchImageLibrary: mockFetch, subscribeToImageLibrary: mockSubscribe });

		renderHook(() => useImageLibrary());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith();
			expect(mockSubscribe).toHaveBeenCalledWith();
		});
	});

	it("calls cleanup on unmount", async () => {
		vi.resetAllMocks();
		vi.mocked(useLocation).mockReturnValue(
			forceCast<ReturnType<typeof useLocation>>({ pathname: "/lib" }),
		);
		const cleanup = vi.fn();
		const mockSubscribe = vi.fn().mockReturnValue(Effect.succeed(cleanup));
		installStore({ subscribeToImageLibrary: mockSubscribe });

		const { unmount } = renderHook(() => useImageLibrary());

		await waitFor(() => {
			expect(mockSubscribe).toHaveBeenCalledWith();
		});

		unmount();
		expect(cleanup).toHaveBeenCalledWith();
	});

	it("removeFromImageLibrary returns Effect from store", async () => {
		vi.resetAllMocks();
		vi.mocked(useLocation).mockReturnValue(
			forceCast<ReturnType<typeof useLocation>>({ pathname: "/lib" }),
		);
		const mockRemove = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ removeImageFromLibrary: mockRemove });

		const { result } = renderHook(() => useImageLibrary());
		const request: RemoveImageFromLibraryRequest = { image_id: IMAGE_ID };

		await Effect.runPromise(result.current.removeFromImageLibrary(request));

		expect(mockRemove).toHaveBeenCalledWith(request);
	});
});
