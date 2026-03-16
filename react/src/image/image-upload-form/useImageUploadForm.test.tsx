import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import { makeFormEventWithPreventDefault } from "@/react/lib/test-utils/dom-events";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImagePublic } from "../image-types";
import useImageUploadForm from "./useImageUploadForm";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/app-store/useAppStore");

const IMAGE_SLUG = "my-uploaded-image";
const UPLOAD_ERR = "Network error";

function makeImagePublic(slug: string): ImagePublic {
	return {
		image_id: "img-1",
		user_id: "usr-1",
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

function installStore(opts: { uploadImage?: ReturnType<typeof vi.fn> }): void {
	const mockUpload =
		opts.uploadImage ?? vi.fn().mockReturnValue(Effect.succeed(makeImagePublic(IMAGE_SLUG)));
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: { uploadImage: typeof mockUpload }) => unknown>(selector)({
			uploadImage: mockUpload,
		}),
	);
}

/**
 * Harness for useImageUploadForm — "Documentation by Harness".
 *
 * Shows how useImageUploadForm integrates into an image upload UI:
 * - File input for selecting an image
 * - Text fields for image name, description, alt text
 * - Submit and cancel buttons
 * - Preview and error display
 */
function Harness(): ReactElement {
	const {
		altText,
		description,
		fileInputRef,
		handleCancel,
		handleFileChange,
		handleSubmit,
		imageName,
		isSubmitting,
		previewUrl,
		selectedFile,
		setAltText,
		setDescription,
		setImageName,
		uploadError,
	} = useImageUploadForm();

	return (
		<div data-testid="harness">
			<input
				ref={fileInputRef}
				data-testid="file-input"
				type="file"
				accept="image/*"
				onChange={handleFileChange}
			/>
			<input
				data-testid="image-name"
				value={imageName}
				onChange={(ev) => {
					setImageName(ev.target.value);
				}}
			/>
			<input
				data-testid="description"
				value={description}
				onChange={(ev) => {
					setDescription(ev.target.value);
				}}
			/>
			<input
				data-testid="alt-text"
				value={altText}
				onChange={(ev) => {
					setAltText(ev.target.value);
				}}
			/>
			<form
				data-testid="upload-form"
				onSubmit={(ev) => {
					void handleSubmit(ev);
				}}
			>
				<button type="submit" data-testid="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? "Uploading…" : "Upload"}
				</button>
			</form>
			<button type="button" data-testid="cancel-btn" onClick={handleCancel}>
				Cancel
			</button>
			{previewUrl !== undefined && <img data-testid="preview" src={previewUrl} alt="Preview" />}
			{selectedFile !== undefined && (
				<span data-testid="selected-file-name">{selectedFile.name}</span>
			)}
			{uploadError !== undefined && <span data-testid="upload-error">{uploadError}</span>}
		</div>
	);
}

describe("useImageUploadForm — Harness", () => {
	it("shows initial empty state and exposes all handlers", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const { container } = render(<Harness />);

		expect(forceCast<HTMLInputElement>(within(container).getByTestId("image-name")).value).toBe("");
		expect(forceCast<HTMLInputElement>(within(container).getByTestId("description")).value).toBe(
			"",
		);
		expect(forceCast<HTMLInputElement>(within(container).getByTestId("alt-text")).value).toBe("");
		expect(within(container).queryByTestId("preview")).toBeNull();
		expect(within(container).queryByTestId("upload-error")).toBeNull();
	});

	it("sets uploadError when submitting without a selected file", async () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const rendered = render(<Harness />);
		const form = within(rendered.container).getByTestId("upload-form");

		fireEvent.submit(form);

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("upload-error").textContent).toBe(
				"Please select an image file.",
			);
		});
	});

	it("navigates to library on cancel", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		installStore({});

		const rendered = render(<Harness />);
		fireEvent.click(within(rendered.container).getByTestId("cancel-btn"));

		expect(mockNavigate).toHaveBeenCalledWith("/en/dashboard/image-library");
	});
});

describe("useImageUploadForm — renderHook", () => {
	it("returns empty initial state", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const { result } = renderHook(() => useImageUploadForm());

		expect({
			imageName: result.current.imageName,
			description: result.current.description,
			altText: result.current.altText,
			selectedFile: result.current.selectedFile,
			previewUrl: result.current.previewUrl,
			uploadError: result.current.uploadError,
			isSubmitting: result.current.isSubmitting,
		}).toStrictEqual({
			imageName: "",
			description: "",
			altText: "",
			selectedFile: undefined,
			previewUrl: undefined,
			uploadError: undefined,
			isSubmitting: false,
		});
	});

	it("handleFileChange sets selectedFile and derives imageName from filename", async () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const { result } = renderHook(() => useImageUploadForm());
		const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

		result.current.handleFileChange(
			forceCast<React.ChangeEvent<HTMLInputElement>>({
				target: { files: [file] },
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedFile).toStrictEqual(file);
			expect(result.current.imageName).toBe("photo");
		});
	});

	it("navigates to image view on successful upload", async () => {
		vi.resetAllMocks();
		installLocale();
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		installStore({});

		const { result } = renderHook(() => useImageUploadForm());
		const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

		result.current.handleFileChange(
			forceCast<React.ChangeEvent<HTMLInputElement>>({
				target: { files: [file] },
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedFile).toBeDefined();
		});

		const { event } = makeFormEventWithPreventDefault();
		await result.current.handleSubmit(event);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/en/image/my-uploaded-image");
		});
	});

	it("sets uploadError when upload fails", async () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({
			uploadImage: vi.fn().mockReturnValue(Effect.fail(new Error(UPLOAD_ERR))),
		});

		const { result } = renderHook(() => useImageUploadForm());
		const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

		result.current.handleFileChange(
			forceCast<React.ChangeEvent<HTMLInputElement>>({
				target: { files: [file] },
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedFile).toBeDefined();
		});

		const { event } = makeFormEventWithPreventDefault();
		await result.current.handleSubmit(event);

		await waitFor(() => {
			expect(result.current.uploadError).toContain(UPLOAD_ERR);
			expect(result.current.isSubmitting).toBe(false);
		});
	});
});
