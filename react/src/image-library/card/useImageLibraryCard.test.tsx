import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import type { ImageLibraryEntry } from "../image-library-types";
import useImageLibraryCard from "./useImageLibraryCard";

vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/image/getImagePublicUrl");

const IMAGE_ID = "img-1";
const OWNER_ID = "owner-1";
const OTHER_USER_ID = "other-1";
const R2_KEY = "images/owner-1/img-1.jpg";
const IMAGE_SLUG = "my-image";
const CDN_URL = "https://cdn.example.com/img.jpg";

function makeEntry(opts?: Partial<ImageLibraryEntry>): ImageLibraryEntry {
	return {
		user_id: OWNER_ID,
		image_id: IMAGE_ID,
		created_at: "2026-01-01T00:00:00Z",
		image_public: {
			image_id: IMAGE_ID,
			user_id: OWNER_ID,
			image_name: "Test Image",
			image_slug: IMAGE_SLUG,
			description: "desc",
			alt_text: "alt",
			r2_key: R2_KEY,
			content_type: "image/jpeg",
			file_size: 1024,
			width: 800,
			height: 600,
			focal_point_x: 0,
			focal_point_y: 0,
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
		},
		...opts,
	};
}

function installLocale(): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: (key: string) => key }),
	);
}

function installStore(opts: {
	removeImageFromLibrary?: ReturnType<typeof vi.fn>;
	deleteImage?: ReturnType<typeof vi.fn>;
}): void {
	const mockRemove =
		opts.removeImageFromLibrary ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	const mockDelete = opts.deleteImage ?? vi.fn().mockReturnValue(Effect.succeed(undefined));
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<
			(state: {
				removeImageFromLibrary: typeof mockRemove;
				deleteImage: typeof mockDelete;
			}) => unknown
		>(selector)({
			removeImageFromLibrary: mockRemove,
			deleteImage: mockDelete,
		}),
	);
}

/**
 * Harness for useImageLibraryCard — "Documentation by Harness".
 *
 * Shows how useImageLibraryCard integrates into a library card:
 * - Image preview, view link
 * - Remove button
 * - Owner badge
 */
function Harness(props: {
	entry: ImageLibraryEntry;
	currentUserId: string | undefined;
}): ReactElement {
	const { handleRemove, image, imageUrl, isOwner, viewUrl } = useImageLibraryCard(
		props.entry,
		props.currentUserId,
	);

	return (
		<div data-testid="harness">
			{image !== undefined && <div data-testid="image-name">{image.image_name}</div>}
			{imageUrl !== undefined && <img data-testid="image-preview" src={imageUrl} alt="" />}
			<div data-testid="is-owner">{String(isOwner)}</div>
			{viewUrl !== undefined && (
				<a data-testid="view-link" href={viewUrl}>
					View
				</a>
			)}
			<button type="button" data-testid="remove-btn" onClick={() => void handleRemove()}>
				Remove
			</button>
		</div>
	);
}

/**
 * Harness for delete behavior in useImageLibraryCard.
 */
function DeleteHarness(props: {
	entry: ImageLibraryEntry;
	currentUserId: string | undefined;
}): ReactElement {
	const { handleDelete } = useImageLibraryCard(props.entry, props.currentUserId);

	return (
		<div data-testid="harness">
			<button type="button" data-testid="delete-btn" onClick={() => void handleDelete()}>
				Delete
			</button>
		</div>
	);
}

describe("useImageLibraryCard — Harness", () => {
	it("shows image and view link when entry has image_public", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		installStore({});
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { container } = render(<Harness entry={entry} currentUserId={OTHER_USER_ID} />);

		expect(forceCast<HTMLElement>(within(container).getByTestId("image-name")).textContent).toBe(
			"Test Image",
		);
		expect(
			forceCast<HTMLImageElement>(within(container).getByTestId("image-preview")).src,
		).toContain(CDN_URL);
		expect(forceCast<HTMLElement>(within(container).getByTestId("is-owner")).textContent).toBe(
			"false",
		);
		expect(getImagePublicUrl).toHaveBeenCalledWith(R2_KEY);
	});

	it("calls removeImageFromLibrary when remove clicked", async () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		const mockRemove = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ removeImageFromLibrary: mockRemove });
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { container } = render(<Harness entry={entry} currentUserId={OTHER_USER_ID} />);

		fireEvent.click(within(container).getByTestId("remove-btn"));

		await waitFor(() => {
			expect(mockRemove).toHaveBeenCalledWith({ image_id: IMAGE_ID });
		});
	});
});

describe("useImageLibraryCard — renderHook", () => {
	it("returns undefined imageUrl and viewUrl when entry has no image_public", () => {
		vi.resetAllMocks();
		installLocale();
		installStore({});
		const entry: ImageLibraryEntry = {
			user_id: OWNER_ID,
			image_id: IMAGE_ID,
			created_at: "2026-01-01T00:00:00Z",
		};

		const { result } = renderHook(() => useImageLibraryCard(entry, OTHER_USER_ID));

		expect(result.current.image).toBeUndefined();
		expect(result.current.imageUrl).toBeUndefined();
		expect(result.current.viewUrl).toBeUndefined();
		expect(result.current.isOwner).toBe(false);
	});

	it("computes viewUrl from image slug and lang", () => {
		vi.resetAllMocks();
		installLocale();
		installStore({});
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { result } = renderHook(() => useImageLibraryCard(entry, OTHER_USER_ID));

		expect(result.current.viewUrl).toBe(buildPathWithLang(`/image/${IMAGE_SLUG}`, "en"));
	});

	it("isOwner is true when currentUserId matches image_public.user_id", () => {
		vi.resetAllMocks();
		installLocale();
		installStore({});
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { result } = renderHook(() => useImageLibraryCard(entry, OWNER_ID));

		expect(result.current.isOwner).toBe(true);
	});

	it("handleRemove calls removeImageFromLibrary with image_id", async () => {
		vi.resetAllMocks();
		installLocale();
		const mockRemove = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ removeImageFromLibrary: mockRemove });
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { result } = renderHook(() => useImageLibraryCard(entry, OTHER_USER_ID));

		await result.current.handleRemove();

		expect(mockRemove).toHaveBeenCalledWith({ image_id: IMAGE_ID });
	});

	it("handleDelete calls deleteImage with image_id", async () => {
		vi.resetAllMocks();
		installLocale();
		const mockDelete = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ deleteImage: mockDelete });
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { result } = renderHook(() => useImageLibraryCard(entry, OWNER_ID));

		await result.current.handleDelete();

		expect(mockDelete).toHaveBeenCalledWith(IMAGE_ID);
	});
});

describe("useImageLibraryCard delete harness", () => {
	it("calls deleteImage when delete clicked", async () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		const mockDelete = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ deleteImage: mockDelete });
		vi.mocked(getImagePublicUrl).mockReturnValue(CDN_URL);

		const entry = makeEntry();
		const { container } = render(<DeleteHarness entry={entry} currentUserId={OWNER_ID} />);

		fireEvent.click(within(container).getByTestId("delete-btn"));

		await waitFor(() => {
			expect(mockDelete).toHaveBeenCalledWith(IMAGE_ID);
		});
	});
});
