import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import ImageEditForm from "@/react/image/image-edit-form/ImageEditForm";
import type { ImagePublic } from "@/react/image/image-types";
import makeImagePublic from "@/react/image/test-utils/makeImagePublic.test-util";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation, SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import ImageEdit from "./ImageEdit";
import useImageEdit from "./useImageEdit";

vi.mock("./useImageEdit");
vi.mock("@/react/image/image-edit-form/ImageEditForm");
vi.mock("@/react/image/getImagePublicUrl");
vi.mock("@/react/slide-orientation/useSlideOrientationPreference");

const LAST_CALL_INDEX = -1;
const FIRST_ARG_INDEX = 0;
const mockedImageEditForm = vi.mocked(ImageEditForm);

function getLatestImageEditFormProps(): React.ComponentProps<typeof ImageEditForm> {
	const lastCall = mockedImageEditForm.mock.calls.at(LAST_CALL_INDEX);
	if (lastCall === undefined) {
		throw new Error("expected ImageEditForm to be rendered");
	}

	return lastCall[FIRST_ARG_INDEX];
}

function makeImage(): ImagePublic {
	return makeImagePublic({
		user_id: "usr-owner",
		r2_key: "images/usr-owner/img-1.jpg",
	});
}

describe("imageEdit", () => {
	it("shows owner delete button when not confirming", () => {
		vi.mocked(useSlideOrientationPreference).mockReturnValue({
			effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
			isSystemSlideOrientation: false,
			slideOrientationPreference: SlideOrientationPreference.landscape,
		});
		vi.mocked(getImagePublicUrl).mockReturnValue("https://cdn.example.com/image.jpg");
		vi.mocked(ImageEditForm).mockImplementation(function ImageEditFormMock(): ReactElement {
			return <div data-testid="image-edit-form" />;
		});
		vi.mocked(useImageEdit).mockReturnValue({
			handleDeleteConfirm: vi.fn(),
			image: makeImage(),
			isImageLoading: false,
			isOwner: true,
		});

		render(<ImageEdit />);

		expect(screen.getByText("Edit Image")).toBeTruthy();
		expect(screen.getByRole("img", { name: "alt" })).toBeTruthy();
		expect(getImagePublicUrl).toHaveBeenCalledWith("images/usr-owner/img-1.jpg");
		expect(getLatestImageEditFormProps().onDelete).toBeTypeOf("function");
	});

	it("omits delete handler for non-owner", () => {
		vi.mocked(useSlideOrientationPreference).mockReturnValue({
			effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
			isSystemSlideOrientation: false,
			slideOrientationPreference: SlideOrientationPreference.landscape,
		});
		vi.mocked(getImagePublicUrl).mockReturnValue("https://cdn.example.com/image.jpg");
		vi.mocked(ImageEditForm).mockImplementation(function ImageEditFormMock(): ReactElement {
			return <div data-testid="image-edit-form" />;
		});
		const handleDeleteConfirm = vi.fn();

		vi.mocked(useImageEdit).mockReturnValue({
			handleDeleteConfirm,
			image: makeImage(),
			isImageLoading: false,
			isOwner: false,
		});

		render(<ImageEdit />);

		expect(getLatestImageEditFormProps().onDelete).toBeUndefined();
		expect(handleDeleteConfirm).not.toHaveBeenCalled();
	});

	it("uses a portrait preview frame when the orientation preference resolves to portrait", () => {
		vi.mocked(useSlideOrientationPreference).mockReturnValue({
			effectiveSlideOrientation: ResolvedSlideOrientation.portrait,
			isSystemSlideOrientation: false,
			slideOrientationPreference: SlideOrientationPreference.portrait,
		});
		vi.mocked(getImagePublicUrl).mockReturnValue("https://cdn.example.com/image.jpg");
		vi.mocked(ImageEditForm).mockImplementation(function ImageEditFormMock(): ReactElement {
			return <div data-testid="image-edit-form" />;
		});
		vi.mocked(useImageEdit).mockReturnValue({
			handleDeleteConfirm: vi.fn(),
			image: makeImage(),
			isImageLoading: false,
			isOwner: true,
		});

		const { container } = render(<ImageEdit />);
		const previewFrame = container.querySelector(String.raw`div.aspect-\[9\/16\]`);

		expect(previewFrame).toBeTruthy();
	});
});
