import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { ImageLibraryEntry } from "../image-library-types";
import ImageLibraryCard from "./ImageLibraryCard";
import useImageLibraryCard from "./useImageLibraryCard";

vi.mock("./useImageLibraryCard");

const ONE_CALL = 1;

const ENTRY: ImageLibraryEntry = {
	user_id: "owner-1",
	image_id: "image-1",
	created_at: "2026-01-01T00:00:00Z",
};

describe("imageLibraryCard", () => {
	it("shows remove for non-owners and calls handleRemove", () => {
		const handleRemove = vi.fn().mockResolvedValue(undefined);
		vi.mocked(useImageLibraryCard).mockReturnValue({
			editUrl: undefined,
			handleDelete: vi.fn().mockResolvedValue(undefined),
			handleRemove,
			image: undefined,
			imageUrl: undefined,
			isOwner: false,
			viewUrl: undefined,
		});

		render(
			<MemoryRouter>
				<ImageLibraryCard entry={ENTRY} currentUserId="viewer-1" />
			</MemoryRouter>,
		);

		const removeButton = screen.getByRole("button", { name: "Remove" });
		expect(removeButton).toBeTruthy();

		fireEvent.click(removeButton);

		expect(handleRemove).toHaveBeenCalledTimes(ONE_CALL);
		expect(screen.queryByText("Confirm?")).toBeNull();
	});

	it("shows inline delete confirmation for owners", () => {
		const handleDelete = vi.fn().mockResolvedValue(undefined);
		vi.mocked(useImageLibraryCard).mockReturnValue({
			editUrl: undefined,
			handleDelete,
			handleRemove: vi.fn().mockResolvedValue(undefined),
			image: undefined,
			imageUrl: undefined,
			isOwner: true,
			viewUrl: undefined,
		});

		render(
			<MemoryRouter>
				<ImageLibraryCard entry={ENTRY} currentUserId="owner-1" />
			</MemoryRouter>,
		);

		const initialDeleteButton = screen.getByRole("button", { name: "Delete" });
		expect(initialDeleteButton).toBeTruthy();

		fireEvent.click(initialDeleteButton);

		expect(screen.getByText("Confirm?")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
		expect(handleDelete).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(handleDelete).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("hides inline delete confirmation when canceled", () => {
		vi.mocked(useImageLibraryCard).mockReturnValue({
			editUrl: undefined,
			handleDelete: vi.fn().mockResolvedValue(undefined),
			handleRemove: vi.fn().mockResolvedValue(undefined),
			image: undefined,
			imageUrl: undefined,
			isOwner: true,
			viewUrl: undefined,
		});

		render(
			<MemoryRouter>
				<ImageLibraryCard entry={ENTRY} currentUserId="owner-1" />
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(screen.getByText("Confirm?")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(screen.queryByText("Confirm?")).toBeNull();
		expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
	});
});
