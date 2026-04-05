import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import { ONE } from "@/shared/constants/shared-constants";

import ImageEditFormFooter from "./ImageEditFormFooter";

vi.mock("react-i18next");

describe("image edit form footer", () => {
	it("renders save, reset, cancel, and delete buttons", () => {
		mockUseTranslation();

		render(
			<ImageEditFormFooter
				hasChanges={false}
				isSubmitting={false}
				onCancel={vi.fn()}
				onDelete={vi.fn()}
				onReset={vi.fn()}
				saveLabel="Save Changes"
			/>,
		);

		expect(screen.getByTestId("save-image-button")).toBeTruthy();
		expect(screen.getByTestId("reset-image-button")).toBeTruthy();
		expect(screen.getByTestId("cancel-image-button")).toBeTruthy();
		expect(screen.getByTestId("delete-image-button")).toBeTruthy();
		cleanup();
	});

	it("prompts before leaving when there are unsaved changes", () => {
		mockUseTranslation();
		const onCancel = vi.fn();

		render(
			<ImageEditFormFooter
				hasChanges
				isSubmitting={false}
				onCancel={onCancel}
				onDelete={vi.fn()}
				onReset={vi.fn()}
				saveLabel="Save Changes"
			/>,
		);

		fireEvent.click(screen.getByTestId("cancel-image-button"));
		expect(screen.getByTestId("cancel-leave-confirm")).toBeTruthy();
		expect(onCancel).not.toHaveBeenCalled();

		fireEvent.click(screen.getByTestId("cancel-leave-stay"));
		expect(screen.queryByTestId("cancel-leave-confirm")).toBeNull();
		expect(onCancel).not.toHaveBeenCalled();

		fireEvent.click(screen.getByTestId("cancel-image-button"));
		fireEvent.click(screen.getByTestId("cancel-leave-confirm"));
		expect(onCancel).toHaveBeenCalledTimes(ONE);
		cleanup();
	});

	it("calls cancel immediately when nothing changed", () => {
		mockUseTranslation();
		const onCancel = vi.fn();

		render(
			<ImageEditFormFooter
				hasChanges={false}
				isSubmitting={false}
				onCancel={onCancel}
				onDelete={vi.fn()}
				onReset={vi.fn()}
				saveLabel="Save Changes"
			/>,
		);

		fireEvent.click(screen.getByTestId("cancel-image-button"));
		expect(onCancel).toHaveBeenCalledTimes(ONE);
		expect(screen.queryByTestId("cancel-leave-confirm")).toBeNull();
		cleanup();
	});

	it("applies the unsaved footer color state", () => {
		mockUseTranslation();
		const { container, rerender } = render(
			<ImageEditFormFooter
				hasChanges
				isSubmitting={false}
				onCancel={vi.fn()}
				onDelete={vi.fn()}
				onReset={vi.fn()}
				saveLabel="Save Changes"
			/>,
		);

		const footer = container.querySelector("footer");
		expect(Boolean(footer?.classList.contains("bg-amber-900/80"))).toBe(true);

		rerender(
			<ImageEditFormFooter
				hasChanges={false}
				isSubmitting={false}
				onCancel={vi.fn()}
				onDelete={vi.fn()}
				onReset={vi.fn()}
				saveLabel="Save Changes"
			/>,
		);

		expect(Boolean(footer?.classList.contains("bg-gray-800"))).toBe(true);
		cleanup();
	});

	it("prompts before deleting and confirms the delete action", () => {
		mockUseTranslation();
		const onDelete = vi.fn().mockResolvedValue(undefined);

		render(
			<ImageEditFormFooter
				hasChanges={false}
				isSubmitting={false}
				onCancel={vi.fn()}
				onDelete={onDelete}
				onReset={vi.fn()}
				saveLabel="Save Changes"
			/>,
		);

		fireEvent.click(screen.getByTestId("delete-image-button"));
		expect(screen.getByTestId("delete-image-confirm")).toBeTruthy();

		fireEvent.click(screen.getByTestId("delete-image-cancel"));
		expect(screen.queryByTestId("delete-image-confirm")).toBeNull();

		fireEvent.click(screen.getByTestId("delete-image-button"));
		fireEvent.click(screen.getByTestId("delete-image-confirm"));
		expect(onDelete).toHaveBeenCalledTimes(ONE);
		cleanup();
	});
});
