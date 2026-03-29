import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import getImagePublicUrl from "@/react/image/getImagePublicUrl";
import ImageEditForm from "@/react/image/image-edit-form/ImageEditForm";
import type { ImagePublic } from "@/react/image/image-types";

import ImageEdit from "./ImageEdit";
import useImageEdit from "./useImageEdit";

vi.mock("./useImageEdit");
vi.mock("@/react/image/image-edit-form/ImageEditForm");
vi.mock("@/react/image/getImagePublicUrl");

function makeImage(): ImagePublic {
	return {
		image_id: "img-1",
		user_id: "usr-owner",
		image_name: "My Image",
		image_slug: "my-image",
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

describe("imageEdit", () => {
	it("shows owner delete button when not confirming", () => {
		vi.mocked(getImagePublicUrl).mockReturnValue("https://cdn.example.com/image.jpg");
		vi.mocked(ImageEditForm).mockImplementation(function ImageEditFormMock(): ReactElement {
			return <div data-testid="image-edit-form" />;
		});
		vi.mocked(useImageEdit).mockReturnValue({
			handleDeleteCancel: vi.fn(),
			handleDeleteClick: vi.fn(),
			handleDeleteConfirm: vi.fn(),
			image: makeImage(),
			isConfirmingDelete: false,
			isImageLoading: false,
			isOwner: true,
		});

		render(<ImageEdit />);

		expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
		expect(screen.queryByText("Confirm?")).toBeNull();
		expect(screen.getByRole("img", { name: "alt" })).toBeTruthy();
		expect(getImagePublicUrl).toHaveBeenCalledWith("images/usr-owner/img-1.jpg");
	});

	it("shows inline confirmation and wires cancel/confirm actions", () => {
		vi.mocked(getImagePublicUrl).mockReturnValue("https://cdn.example.com/image.jpg");
		vi.mocked(ImageEditForm).mockImplementation(function ImageEditFormMock(): ReactElement {
			return <div data-testid="image-edit-form" />;
		});
		const handleDeleteCancel = vi.fn();
		const handleDeleteConfirm = vi.fn();

		vi.mocked(useImageEdit).mockReturnValue({
			handleDeleteCancel,
			handleDeleteClick: vi.fn(),
			handleDeleteConfirm,
			image: makeImage(),
			isConfirmingDelete: true,
			isImageLoading: false,
			isOwner: true,
		});

		render(<ImageEdit />);

		expect(screen.getByText("Confirm?")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(handleDeleteCancel).toHaveBeenCalledWith(expect.anything());
		expect(handleDeleteConfirm).toHaveBeenCalledWith(expect.anything());
	});
});
