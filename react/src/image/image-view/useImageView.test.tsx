import { act, cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImagePublic } from "../image-types";
import useImageView from "./useImageView";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/image/getImagePublicUrl");
vi.mock("@/react/lib/qr-code/buildPublicWebUrl");
vi.mock("@/react/share/subscribe/useShareSubscription");

const IMAGE_SLUG = "my-image";
const USER_ID = "usr-1";

function makeImagePublic(slug: string): ImagePublic {
	return {
		image_id: "img-1",
		user_id: USER_ID,
		image_name: "My Image",
		image_slug: slug,
		description: "desc",
		alt_text: "alt",
		r2_key: "images/usr-1/img-1.jpg",
		content_type: "image/jpeg",
		file_size: 1024,
		width: 800,
		height: 600,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
	};
}

function installLocale(): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: (key: string) => key }),
	);
}

function installStore(opts: {
	publicImages?: Record<string, ImagePublic>;
	isImageLoading?: boolean;
	imageError?: string | undefined;
	fetchImageBySlug?: ReturnType<typeof vi.fn>;
	deleteImage?: ReturnType<typeof vi.fn>;
}): void {
	const {
		publicImages = {},
		isImageLoading = false,
		imageError,
		fetchImageBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined)),
		deleteImage = vi.fn().mockReturnValue(Effect.succeed(undefined)),
	} = opts;

	const mockState = {
		publicImages,
		isImageLoading,
		imageError,
		fetchImageBySlug,
		deleteImage,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}

/**
 * Harness for useImageView — "Documentation by Harness".
 *
 * Shows how useImageView integrates into an image view page:
 * - Displays image, loading state, error
 * - Edit button for owners
 * - QR code URL for sharing
 */
function Harness(): ReactElement {
	const { handleEditClick, image, imageError, imageUrl, isImageLoading, isOwner, qrCodeUrl } =
		useImageView();

	return (
		<div data-testid="harness">
			<div data-testid="image-loading">{String(isImageLoading)}</div>
			{image !== undefined && <div data-testid="image-name">{image.image_name}</div>}
			{imageError !== undefined && <span data-testid="image-error">{imageError}</span>}
			{imageUrl !== undefined && <img data-testid="image-preview" src={imageUrl} alt="" />}
			<div data-testid="is-owner">{String(isOwner)}</div>
			{qrCodeUrl !== undefined && <div data-testid="qr-url">{qrCodeUrl}</div>}
			<button type="button" data-testid="edit-btn" onClick={handleEditClick}>
				Edit
			</button>
		</div>
	);
}

describe("useImageView — Harness", () => {
	it("shows loading when slug is present and no image in store", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		installStore({ publicImages: {}, isImageLoading: true });

		const rendered = render(<Harness />);

		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("image-loading")).textContent,
		).toBe("true");
	});

	it("shows image and edit navigates when owner", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const img = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [img.image_id]: img } });

		const rendered = render(<Harness />);

		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("image-name")).textContent,
		).toBe(img.image_name);
		expect(
			forceCast<HTMLElement>(within(rendered.container).getByTestId("is-owner")).textContent,
		).toBe("true");

		fireEvent.click(within(rendered.container).getByTestId("edit-btn"));

		expect(mockNavigate).toHaveBeenCalledWith("/en/dashboard/image-edit/my-image");
	});
});

describe("useImageView — renderHook", () => {
	it("returns undefined image when slug is undefined", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		installStore({});

		const { result } = renderHook(() => useImageView());

		expect(result.current.image).toBeUndefined();
		expect(result.current.imageUrl).toBeUndefined();
		expect(result.current.isOwner).toBe(false);
	});

	it("returns image from store when slug matches", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		const img = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [img.image_id]: img } });
		vi.mocked(getImagePublicUrl).mockReturnValue("https://cdn.example.com/img.jpg");
		vi.mocked(buildPublicWebUrl).mockReturnValue("https://qr.example.com");

		const { result } = renderHook(() => useImageView());

		expect(result.current.image).toStrictEqual(img);
		expect(result.current.isOwner).toBe(false);
		expect(getImagePublicUrl).toHaveBeenCalledWith(img.r2_key);
	});

	it("isOwner is true when currentUserId matches image owner", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const img = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [img.image_id]: img } });

		const { result } = renderHook(() => useImageView());

		expect(result.current.isOwner).toBe(true);
	});

	it("handleEditClick navigates to edit path", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const img = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [img.image_id]: img } });

		const { result } = renderHook(() => useImageView());

		result.current.handleEditClick();

		expect(mockNavigate).toHaveBeenCalledWith("/en/dashboard/image-edit/my-image");
	});

	it("calls fetchImageBySlug when slug is present", async () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		vi.mocked(useCurrentUserId).mockReturnValue(undefined);
		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({ fetchImageBySlug: mockFetch });

		renderHook(() => useImageView());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(IMAGE_SLUG);
		});
	});

	it("manages delete confirmation state", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		const img = makeImagePublic(IMAGE_SLUG);
		installStore({ publicImages: { [img.image_id]: img } });

		const { result } = renderHook(() => useImageView());

		expect(result.current.isConfirmingDelete).toBe(false);

		// Click delete to start confirmation

		act(() => {
			result.current.handleDeleteClick();
		});
		expect(result.current.isConfirmingDelete).toBe(true);

		// Cancel confirmation
		act(() => {
			result.current.handleDeleteCancel();
		});
		expect(result.current.isConfirmingDelete).toBe(false);

		// Confirm deletion
		act(() => {
			result.current.handleDeleteClick();
		});
		expect(result.current.isConfirmingDelete).toBe(true);
	});

	it("handleDeleteConfirm calls deleteImage and navigates", async () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useParams).mockReturnValue({ image_slug: IMAGE_SLUG });
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const img = makeImagePublic(IMAGE_SLUG);
		const mockDelete = vi.fn().mockReturnValue(Effect.succeed(undefined));
		installStore({
			publicImages: { [img.image_id]: img },
			deleteImage: mockDelete,
		});

		const { result } = renderHook(() => useImageView());

		result.current.handleDeleteConfirm();

		await waitFor(() => {
			expect(mockDelete).toHaveBeenCalledWith(img.image_id);
			expect(mockNavigate).toHaveBeenCalledWith("/en/dashboard/image-library");
		});
	});
});
