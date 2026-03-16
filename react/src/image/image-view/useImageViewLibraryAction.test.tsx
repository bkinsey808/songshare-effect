import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import useImageViewLibraryAction from "./useImageViewLibraryAction";

vi.mock("@/react/app-store/useAppStore");

const IMAGE_ID = "img-1";
const OWNER_ID = "owner-1";
const OTHER_USER_ID = "user-2";

function installStore(opts: {
	userSessionData?: { user?: { user_id?: string } };
	imageLibraryEntries?: Record<string, unknown>;
	isImageLibraryLoading?: boolean;
	addImageToLibrary?: ReturnType<typeof vi.fn>;
	removeImageFromLibrary?: ReturnType<typeof vi.fn>;
	fetchImageLibrary?: ReturnType<typeof vi.fn>;
}): void {
	const userSessionData = opts.userSessionData ?? { user: { user_id: undefined } };
	const imageLibraryEntries = opts.imageLibraryEntries ?? {};
	const isImageLibraryLoading = opts.isImageLibraryLoading ?? false;
	const addImageToLibrary =
		opts.addImageToLibrary ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const removeImageFromLibrary =
		opts.removeImageFromLibrary ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const fetchImageLibrary =
		opts.fetchImageLibrary ?? vi.fn().mockReturnValue(Effect.succeed(undefined));

	const mockState = {
		userSessionData,
		imageLibraryEntries,
		isImageLibraryLoading,
		addImageToLibrary,
		removeImageFromLibrary,
		fetchImageLibrary,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}

/**
 * Harness for useImageViewLibraryAction — "Documentation by Harness".
 *
 * Shows how the hook integrates into an image view with add/remove library actions:
 * - Add button when not in library
 * - Remove button when in library and not owner
 * - Pending state during operations
 */
function Harness(props: { imageId: string; imageOwnerId: string }): ReactElement {
	const { handleAdd, handleRemove, isPending, showAdd, showRemove } = useImageViewLibraryAction(
		props.imageId,
		props.imageOwnerId,
	);

	return (
		<div data-testid="harness">
			<div data-testid="show-add">{String(showAdd)}</div>
			<div data-testid="show-remove">{String(showRemove)}</div>
			<div data-testid="is-pending">{String(isPending)}</div>
			{showAdd && (
				<button
					type="button"
					data-testid="add-btn"
					disabled={isPending}
					onClick={() => {
						void handleAdd();
					}}
				>
					Add to Library
				</button>
			)}
			{showRemove && (
				<button
					type="button"
					data-testid="remove-btn"
					disabled={isPending}
					onClick={() => {
						void handleRemove();
					}}
				>
					Remove from Library
				</button>
			)}
		</div>
	);
}

describe("useImageViewLibraryAction — Harness", () => {
	it("shows add button when logged in, not loading, and not in library", () => {
		cleanup();
		vi.resetAllMocks();
		installStore({
			userSessionData: { user: { user_id: OTHER_USER_ID } },
			imageLibraryEntries: {},
			isImageLibraryLoading: false,
		});

		const rendered = render(<Harness imageId={IMAGE_ID} imageOwnerId={OWNER_ID} />);

		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("show-add")).textContent,
		).toBe("true");
		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("show-remove")).textContent,
		).toBe("false");
	});

	it("shows remove button when in library and not owner", () => {
		cleanup();
		vi.resetAllMocks();
		installStore({
			userSessionData: { user: { user_id: OTHER_USER_ID } },
			imageLibraryEntries: { [IMAGE_ID]: {} },
			isImageLibraryLoading: false,
		});

		const rendered = render(<Harness imageId={IMAGE_ID} imageOwnerId={OWNER_ID} />);

		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("show-add")).textContent,
		).toBe("false");
		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("show-remove")).textContent,
		).toBe("true");
	});

	it("calls addImageToLibrary when add button is clicked", async () => {
		cleanup();
		vi.resetAllMocks();
		const mockAdd = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({
			userSessionData: { user: { user_id: OTHER_USER_ID } },
			imageLibraryEntries: {},
			addImageToLibrary: mockAdd,
		});

		const rendered = render(<Harness imageId={IMAGE_ID} imageOwnerId={OWNER_ID} />);
		fireEvent.click(within(rendered.container).getByTestId("add-btn"));

		await waitFor(() => {
			expect(mockAdd).toHaveBeenCalledWith({ image_id: IMAGE_ID });
		});
	});
});

describe("useImageViewLibraryAction — renderHook", () => {
	it("hides both buttons when not logged in", () => {
		vi.resetAllMocks();
		installStore({
			userSessionData: { user: {} },
			imageLibraryEntries: {},
		});

		const { result } = renderHook(() => useImageViewLibraryAction(IMAGE_ID, OWNER_ID));

		expect(result.current.showAdd).toBe(false);
		expect(result.current.showRemove).toBe(false);
	});

	it("owner sees Add when image not in library (showAdd does not exclude owners)", () => {
		vi.resetAllMocks();
		installStore({
			userSessionData: { user: { user_id: OWNER_ID } },
			imageLibraryEntries: {},
		});

		const { result } = renderHook(() => useImageViewLibraryAction(IMAGE_ID, OWNER_ID));

		expect(result.current.showAdd).toBe(true);
	});

	it("handleAdd calls addImageToLibrary with image_id", async () => {
		vi.resetAllMocks();
		const mockAdd = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({
			userSessionData: { user: { user_id: OTHER_USER_ID } },
			imageLibraryEntries: {},
			addImageToLibrary: mockAdd,
		});

		const { result } = renderHook(() => useImageViewLibraryAction(IMAGE_ID, OWNER_ID));

		await result.current.handleAdd();

		expect(mockAdd).toHaveBeenCalledWith({ image_id: IMAGE_ID });
	});

	it("handleRemove calls removeImageFromLibrary with image_id", async () => {
		vi.resetAllMocks();
		const mockRemove = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({
			userSessionData: { user: { user_id: OTHER_USER_ID } },
			imageLibraryEntries: { [IMAGE_ID]: {} },
			removeImageFromLibrary: mockRemove,
		});

		const { result } = renderHook(() => useImageViewLibraryAction(IMAGE_ID, OWNER_ID));

		await result.current.handleRemove();

		expect(mockRemove).toHaveBeenCalledWith({ image_id: IMAGE_ID });
	});
});
