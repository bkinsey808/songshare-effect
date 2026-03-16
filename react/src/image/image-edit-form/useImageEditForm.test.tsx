import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import { makeFormEventWithPreventDefault } from "@/react/lib/test-utils/dom-events";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImagePublic } from "../image-types";
import useImageEditForm from "./useImageEditForm";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/app-store/useAppStore");

const IMAGE_SLUG = "my-image";
const SAVE_ERR = "Save failed";

function makeImagePublic(overrides?: Partial<ImagePublic>): ImagePublic {
	return {
		image_id: "img-1",
		user_id: "usr-1",
		image_name: "Original Name",
		image_slug: IMAGE_SLUG,
		description: "Original desc",
		alt_text: "Original alt",
		r2_key: "images/usr-1/img-1.jpg",
		content_type: "image/jpeg",
		file_size: 1024,
		width: 800,
		height: 600,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

function installLocale(): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: (key: string) => key }),
	);
}

function installStore(opts: { updateImage?: ReturnType<typeof vi.fn> }): void {
	const mockUpdate =
		opts.updateImage ??
		vi.fn().mockReturnValue(Effect.succeed(makeImagePublic({ image_slug: IMAGE_SLUG })));
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: { updateImage: typeof mockUpdate }) => unknown>(selector)({
			updateImage: mockUpdate,
		}),
	);
}

/**
 * Harness for useImageEditForm — "Documentation by Harness".
 *
 * Shows how useImageEditForm integrates into an image edit UI:
 * - Text fields for image name, description, alt text
 * - Submit and cancel buttons
 * - Error display
 */
function Harness(props: { image: ImagePublic }): ReactElement {
	const {
		altText,
		description,
		handleCancel,
		handleSubmit,
		imageName,
		isSubmitting,
		saveError,
		setAltText,
		setDescription,
		setImageName,
	} = useImageEditForm(props.image);

	return (
		<div data-testid="harness">
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
				data-testid="edit-form"
				onSubmit={(ev) => {
					void handleSubmit(ev);
				}}
			>
				<button type="submit" data-testid="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? "Saving…" : "Save"}
				</button>
			</form>
			<button type="button" data-testid="cancel-btn" onClick={handleCancel}>
				Cancel
			</button>
			{saveError !== undefined && <span data-testid="save-error">{saveError}</span>}
		</div>
	);
}

describe("useImageEditForm — Harness", () => {
	it("shows initial values from image prop", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const image = makeImagePublic({
			image_name: "Test Image",
			description: "Test desc",
			alt_text: "Test alt",
		});
		const { container } = render(<Harness image={image} />);

		expect(forceCast<HTMLInputElement>(within(container).getByTestId("image-name")).value).toBe(
			"Test Image",
		);
		expect(forceCast<HTMLInputElement>(within(container).getByTestId("description")).value).toBe(
			"Test desc",
		);
		expect(forceCast<HTMLInputElement>(within(container).getByTestId("alt-text")).value).toBe(
			"Test alt",
		);
		expect(within(container).queryByTestId("save-error")).toBeNull();
	});

	it("navigates to image view on cancel", () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		installStore({});

		const image = makeImagePublic();
		const rendered = render(<Harness image={image} />);
		fireEvent.click(within(rendered.container).getByTestId("cancel-btn"));

		expect(mockNavigate).toHaveBeenCalledWith("/en/image/my-image");
	});

	it("navigates to image view on successful save", async () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		installStore({});

		const image = makeImagePublic();
		const rendered = render(<Harness image={image} />);
		const form = within(rendered.container).getByTestId("edit-form");

		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/en/image/my-image");
		});
	});

	it("sets saveError when update fails", async () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({
			updateImage: vi.fn().mockReturnValue(Effect.fail(new Error(SAVE_ERR))),
		});

		const image = makeImagePublic();
		const rendered = render(<Harness image={image} />);
		const form = within(rendered.container).getByTestId("edit-form");

		fireEvent.submit(form);

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("save-error").textContent).toContain(SAVE_ERR);
		});
	});
});

describe("useImageEditForm — renderHook", () => {
	it("returns initial state from image prop", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const image = makeImagePublic({
			image_name: "Hook Test",
			description: "Desc",
			alt_text: "Alt",
		});
		const { result } = renderHook(() => useImageEditForm(image));

		expect(result.current.imageName).toBe("Hook Test");
		expect(result.current.description).toBe("Desc");
		expect(result.current.altText).toBe("Alt");
		expect(result.current.saveError).toBeUndefined();
		expect(result.current.isSubmitting).toBe(false);
	});

	it("setImageName updates imageName", async () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const image = makeImagePublic({ image_name: "Initial" });
		const { result } = renderHook(() => useImageEditForm(image));

		result.current.setImageName("Updated");

		await waitFor(() => {
			expect(result.current.imageName).toBe("Updated");
		});
	});

	it("handleSubmit calls updateImage with patch", async () => {
		vi.resetAllMocks();
		installLocale();
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		const mockUpdate = vi
			.fn()
			.mockReturnValue(Effect.succeed(makeImagePublic({ image_slug: IMAGE_SLUG })));
		installStore({ updateImage: mockUpdate });

		const image = makeImagePublic({
			image_id: "img-99",
			image_name: "Name",
			description: "Desc",
			alt_text: "Alt",
		});
		const { result } = renderHook(() => useImageEditForm(image));

		result.current.setImageName("New Name");
		result.current.setDescription("New desc");
		result.current.setAltText("New alt");

		await waitFor(() => {
			expect(result.current.imageName).toBe("New Name");
		});

		const { event } = makeFormEventWithPreventDefault();
		await result.current.handleSubmit(event);

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith(
				"img-99",
				expect.objectContaining({
					image_name: "New Name",
					description: "New desc",
					alt_text: "New alt",
				}),
			);
		});
	});
});
