import { act, cleanup, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { ImagePublic } from "@/react/image/image-types";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";

import useImageEdit from "./useImageEdit";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");

const IMAGE_SLUG = "my-image";
const OWNER_ID = "usr-owner";
const OTHER_USER_ID = "usr-other";

/**
 * Builds a valid `ImagePublic` fixture for tests.
 *
 * @param slug - Public image slug for route matching tests.
 * @returns An `ImagePublic` object with stable test defaults.
 */
function makeImagePublic(slug: string): ImagePublic {
	return {
		image_id: "img-1",
		user_id: OWNER_ID,
		image_name: "My Image",
		image_slug: slug,
		description: "desc",
		alt_text: "alt",
		r2_key: "images/usr-owner/img-1.jpg",
		content_type: "image/jpeg",
		file_size: 1024,
		width: 800,
		height: 600,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
	};
}

/**
 * Installs a predictable locale mock for hook tests.
 *
 * @returns Nothing.
 */
function installLocale(): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: (key: string) => key }),
	);
}

/**
 * Installs a mocked app-store snapshot for each test.
 *
 * @param opts - Optional store slices and mocked actions for the current test.
 * @returns Nothing.
 */
function installStore(opts: {
	publicImages?: Record<string, ImagePublic>;
	isImageLoading?: boolean;
	fetchImageBySlug?: ReturnType<typeof vi.fn>;
	deleteImage?: ReturnType<typeof vi.fn>;
}): void {
	const {
		publicImages = {},
		isImageLoading = false,
		fetchImageBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined)),
		deleteImage = vi.fn().mockReturnValue(Effect.succeed(undefined)),
	} = opts;

	const mockState = {
		publicImages,
		isImageLoading,
		fetchImageBySlug,
		deleteImage,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}

/**
 * Harness for useImageEdit — "Documentation by Harness".
 *
 * Shows how useImageEdit provides image/loading state:
 * - loading flag mirrors store loading state
 * - image name appears when route slug matches a loaded image
 * - fallback text when image is missing
 */
function Harness(): ReactElement {
	const { image, isImageLoading } = useImageEdit();

	return (
		<div data-testid="harness">
			<div data-testid="is-loading">{String(isImageLoading)}</div>
			<div data-testid="image-name">{image?.image_name ?? "none"}</div>
		</div>
	);
}

describe("useImageEdit — Harness", () => {
	it("shows loading state from store", () => {
		vi.resetAllMocks();
		cleanup();
		installStore({ isImageLoading: true });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		const rendered = render(<Harness />);

		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("is-loading")).textContent,
		).toBe("true");
		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("image-name")).textContent,
		).toBe("none");
	});

	it("shows image name when route slug matches loaded image", () => {
		vi.resetAllMocks();
		cleanup();
		const image = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [image.image_id]: image } });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(OWNER_ID);

		const rendered = render(<Harness />);

		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("is-loading")).textContent,
		).toBe("false");
		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("image-name")).textContent,
		).toBe(image.image_name);
	});
});

describe("useImageEdit — renderHook", () => {
	it("returns undefined image when image_id is undefined", () => {
		vi.resetAllMocks();
		installStore({});
		installLocale();
		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		const { result } = renderHook(() => useImageEdit());

		expect(result.current.image).toBeUndefined();
		expect(result.current.isImageLoading).toBe(false);
		expect(result.current.isOwner).toBe(false);
		expect(result.current.isConfirmingDelete).toBe(false);
	});

	it("calls fetchImageBySlug when image_id is present", async () => {
		vi.resetAllMocks();
		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ fetchImageBySlug: mockFetch });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		renderHook(() => useImageEdit());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(IMAGE_SLUG);
		});
	});

	it("returns image when route slug matches store entry", () => {
		vi.resetAllMocks();
		const image = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [image.image_id]: image } });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(OWNER_ID);

		const { result } = renderHook(() => useImageEdit());

		expect(result.current.image).toStrictEqual(image);
		expect(result.current.isOwner).toBe(true);
	});

	it("redirects non-owners to image view when loaded", async () => {
		vi.resetAllMocks();
		const image = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [image.image_id]: image }, isImageLoading: false });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		const navigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigate);
		vi.mocked(useCurrentUserId).mockReturnValue(OTHER_USER_ID);

		renderHook(() => useImageEdit());

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith(`/en/image/${IMAGE_SLUG}`);
		});
	});

	it("does not redirect while loading", () => {
		vi.resetAllMocks();
		const image = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [image.image_id]: image }, isImageLoading: true });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		const navigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigate);
		vi.mocked(useCurrentUserId).mockReturnValue(OTHER_USER_ID);

		renderHook(() => useImageEdit());

		expect(navigate).not.toHaveBeenCalled();
	});

	it("manages delete confirmation state", () => {
		vi.resetAllMocks();
		const image = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [image.image_id]: image }, isImageLoading: false });
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(OWNER_ID);

		const { result } = renderHook(() => useImageEdit());

		expect(result.current.isConfirmingDelete).toBe(false);

		act(() => {
			result.current.handleDeleteClick();
		});
		expect(result.current.isConfirmingDelete).toBe(true);

		act(() => {
			result.current.handleDeleteCancel();
		});
		expect(result.current.isConfirmingDelete).toBe(false);
	});

	it("handleDeleteConfirm calls deleteImage and navigates", async () => {
		vi.resetAllMocks();
		const image = makeImagePublic(IMAGE_SLUG);
		const deleteImage = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({
			publicImages: { [image.image_id]: image },
			isImageLoading: false,
			deleteImage,
		});
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_id: IMAGE_SLUG });
		const navigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigate);
		vi.mocked(useCurrentUserId).mockReturnValue(OWNER_ID);

		const { result } = renderHook(() => useImageEdit());

		act(() => {
			result.current.handleDeleteConfirm();
		});

		await waitFor(() => {
			expect(deleteImage).toHaveBeenCalledWith(image.image_id);
			expect(navigate).toHaveBeenCalledWith("/en/dashboard/image-library");
		});
	});
});
