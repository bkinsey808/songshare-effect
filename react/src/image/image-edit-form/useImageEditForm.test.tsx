import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makeImagePublic from "@/react/image/test-utils/makeImagePublic.test-util";
import useLocale from "@/react/lib/language/locale/useLocale";
import { makeFormEventWithPreventDefault } from "@/react/lib/test-utils/dom-events";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ImagePublic } from "../image-types";
import useImageEditForm from "./useImageEditForm";

vi.mock("react-router-dom");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/react/app-store/useAppStore");

const SAVE_ERR = "Save failed";
const DEFAULT_FOCAL_POINT = 50;
const UPDATED_FOCAL_POINT_X = 30;
const UPDATED_FOCAL_POINT_Y = 70;
const DECIMAL_FOCAL_POINT_X = 30.1;
const DECIMAL_FOCAL_POINT_Y = 70.9;

/**
 * Install a mocked locale for useLocale in tests.
 *
 * @returns void
 */
function installLocale(): void {
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: (key: string) => key }),
	);
}

/**
 * Install a mocked image edit slice for `useImageEditForm` tests.
 *
 * @param updateImage - Mocked updateImage handler used by the hook.
 * @returns void
 */
function installStore(opts: { updateImage?: ReturnType<typeof vi.fn> }): void {
	const mockUpdate = opts.updateImage ?? vi.fn().mockReturnValue(Effect.succeed(makeImagePublic()));
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: { updateImage: typeof mockUpdate }) => unknown>(selector)({
			updateImage: mockUpdate,
		}),
	);
}

/**
 * Test harness for `useImageEditForm` demonstrating DOM integration.
 *
 * @param image - Image public object passed into the hook.
 * @returns A small DOM tree used to validate the hook in tests.
 */
function Harness(props: { image: ImagePublic }): ReactElement {
	const {
		altText,
		description,
		focalPointX,
		focalPointY,
		handleCancel,
		handleReset,
		handleSubmit,
		hasChanges,
		imageName,
		isSubmitting,
		saveError,
		setAltText,
		setDescription,
		setFocalPointX,
		setFocalPointY,
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
			<input
				data-testid="focal-point-x"
				value={String(focalPointX)}
				onChange={(ev) => {
					setFocalPointX(Number(ev.target.value));
				}}
			/>
			<input
				data-testid="focal-point-y"
				value={String(focalPointY)}
				onChange={(ev) => {
					setFocalPointY(Number(ev.target.value));
				}}
			/>
			<span data-testid="has-changes">{String(hasChanges)}</span>
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
			<button type="button" data-testid="reset-btn" onClick={handleReset}>
				Reset
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
		expect(forceCast<HTMLInputElement>(within(container).getByTestId("focal-point-x")).value).toBe(
			"50",
		);
		expect(forceCast<HTMLInputElement>(within(container).getByTestId("focal-point-y")).value).toBe(
			"50",
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

	it("tracks and resets unsaved changes", async () => {
		cleanup();
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const image = makeImagePublic({
			image_name: "Original Name",
			description: "Original desc",
			alt_text: "Original alt",
		});
		const rendered = render(<Harness image={image} />);

		expect(within(rendered.container).getByTestId("has-changes").textContent).toBe("false");

		fireEvent.change(within(rendered.container).getByTestId("image-name"), {
			target: { value: "Updated Name" },
		});

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("has-changes").textContent).toBe("true");
		});

		fireEvent.click(within(rendered.container).getByTestId("reset-btn"));

		await waitFor(() => {
			expect(
				forceCast<HTMLInputElement>(within(rendered.container).getByTestId("image-name")).value,
			).toBe("Original Name");
		});
	});
});

describe("useImageEditForm — renderHook", () => {
	it("returns initial state from image prop", () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		installStore({});

		const image = makeImagePublic();
		const { result } = renderHook(() => useImageEditForm(image));

		expect(result.current.imageName).toBe("My Image");
		expect(result.current.description).toBe("desc");
		expect(result.current.altText).toBe("alt");
		expect(result.current).toMatchObject({
			focalPointX: DEFAULT_FOCAL_POINT,
			focalPointY: DEFAULT_FOCAL_POINT,
		});
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
		const mockUpdate = vi.fn().mockReturnValue(Effect.succeed(makeImagePublic()));
		installStore({ updateImage: mockUpdate });

		const image = makeImagePublic();
		const { result } = renderHook(() => useImageEditForm(image));

		result.current.setImageName("New Name");
		result.current.setDescription("New desc");
		result.current.setAltText("New alt");
		result.current.setFocalPointX(UPDATED_FOCAL_POINT_X);
		result.current.setFocalPointY(UPDATED_FOCAL_POINT_Y);

		await waitFor(() => {
			expect(result.current.imageName).toBe("New Name");
		});

		const { event } = makeFormEventWithPreventDefault();
		await result.current.handleSubmit(event);

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith(
				image.image_id,
				expect.objectContaining({
					image_name: "New Name",
					description: "New desc",
					alt_text: "New alt",
					focal_point_x: UPDATED_FOCAL_POINT_X,
					focal_point_y: UPDATED_FOCAL_POINT_Y,
				}),
			);
		});
	});

	it("preserves decimal focal point values when saving", async () => {
		vi.resetAllMocks();
		installLocale();
		vi.mocked(useNavigate).mockReturnValue(vi.fn());
		const mockUpdate = vi.fn().mockReturnValue(Effect.succeed(makeImagePublic()));
		installStore({ updateImage: mockUpdate });

		const image = makeImagePublic();
		const { result } = renderHook(() => useImageEditForm(image));

		result.current.setFocalPointX(DECIMAL_FOCAL_POINT_X);
		result.current.setFocalPointY(DECIMAL_FOCAL_POINT_Y);

		await waitFor(() => {
			expect(result.current.focalPointX).toBe(DECIMAL_FOCAL_POINT_X);
			expect(result.current.focalPointY).toBe(DECIMAL_FOCAL_POINT_Y);
		});

		const { event } = makeFormEventWithPreventDefault();
		await result.current.handleSubmit(event);

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith(
				image.image_id,
				expect.objectContaining({
					focal_point_x: DECIMAL_FOCAL_POINT_X,
					focal_point_y: DECIMAL_FOCAL_POINT_Y,
				}),
			);
		});
	});
});
