import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SongFormFooter from "./SongFormFooter";

vi.mock(
	"react-i18next",
	(): {
		useTranslation: () => {
			t: (key: string, defaultVal?: string | Record<string, unknown>) => string;
			i18n: { language: string };
		};
	} => ({
		useTranslation: (): {
			t: (key: string, defaultVal?: string | Record<string, unknown>) => string;
			i18n: { language: string };
		} => ({
			t: (key: string, defaultVal?: string | Record<string, unknown>): string =>
				typeof defaultVal === "string" ? defaultVal : key,
			i18n: { language: "en" },
		}),
	}),
);

const ONE = 1;

describe("song form footer", () => {
	// Cleanup needed so multiple renders don't stack in the same document (e.g. duplicate testid)
	// eslint-disable-next-line jest/no-hooks -- cleanup is required for correct test isolation
	afterEach(cleanup);

	it("renders create/reset/cancel buttons", (): void => {
		render(
			<SongFormFooter
				hasChanges
				isSubmitting={false}
				isEditing={false}
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("create-song-button")).toBeTruthy();
		expect(screen.getByTestId("reset-song-button")).toBeTruthy();
		expect(screen.getByTestId("cancel-song-button")).toBeTruthy();
	});

	it("calls handlers when buttons are clicked", (): void => {
		const onSave = vi.fn();
		const onReset = vi.fn();
		const onCancel = vi.fn();

		render(
			<SongFormFooter
				hasChanges
				isSubmitting={false}
				isEditing={false}
				onSave={onSave}
				onReset={onReset}
				onCancel={onCancel}
			/>,
		);

		fireEvent.click(screen.getByTestId("create-song-button"));
		fireEvent.click(screen.getByTestId("reset-song-button"));
		// When hasChanges, Cancel shows confirmation; Leave triggers onCancel
		fireEvent.click(screen.getByTestId("cancel-song-button"));
		fireEvent.click(screen.getByTestId("cancel-leave-confirm"));

		expect(onSave).toHaveBeenCalledTimes(ONE);
		expect(onReset).toHaveBeenCalledTimes(ONE);
		expect(onCancel).toHaveBeenCalledTimes(ONE);
	});

	it("calls onCancel immediately when Cancel clicked and no unsaved changes", (): void => {
		const onCancel = vi.fn();
		render(
			<SongFormFooter
				hasChanges={false}
				isSubmitting={false}
				isEditing={false}
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={onCancel}
			/>,
		);

		fireEvent.click(screen.getByTestId("cancel-song-button"));
		expect(onCancel).toHaveBeenCalledTimes(ONE);
		expect(screen.queryByTestId("cancel-leave-confirm")).toBeNull();
	});

	it("shows leave confirmation when Cancel clicked with unsaved changes; Stay dismisses", (): void => {
		const onCancel = vi.fn();
		render(
			<SongFormFooter
				hasChanges
				isSubmitting={false}
				isEditing={false}
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={onCancel}
			/>,
		);

		fireEvent.click(screen.getByTestId("cancel-song-button"));
		expect(screen.getByTestId("cancel-leave-confirm")).toBeTruthy();
		expect(onCancel).not.toHaveBeenCalled();

		fireEvent.click(screen.getByTestId("cancel-leave-stay"));
		expect(onCancel).not.toHaveBeenCalled();
		expect(screen.queryByTestId("cancel-leave-confirm")).toBeNull();
	});

	it("renders update label when editing", (): void => {
		render(
			<SongFormFooter
				hasChanges={false}
				isSubmitting={false}
				isEditing
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		const createBtn = screen.getByTestId("create-song-button");
		expect(String(createBtn.textContent)).toContain("Update Song");
	});

	it("applies hasChanges class to footer", (): void => {
		const { container, rerender } = render(
			<SongFormFooter
				hasChanges
				isSubmitting={false}
				isEditing={false}
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);

		const footer = container.querySelector("footer");
		expect(Boolean(footer?.classList.contains("bg-amber-900/80"))).toBe(true);

		rerender(
			<SongFormFooter
				hasChanges={false}
				isSubmitting={false}
				isEditing={false}
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);

		expect(Boolean(footer?.classList.contains("bg-gray-800"))).toBe(true);
	});

	it("does not render delete section when onDelete not provided", (): void => {
		render(
			<SongFormFooter
				hasChanges={false}
				isSubmitting={false}
				isEditing
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);

		expect(screen.queryByTestId("delete-song-button")).toBeNull();
	});

	it("shows confirmation when delete clicked and calls cancel/confirm", (): void => {
		const onDelete = vi.fn().mockResolvedValue(undefined);
		render(
			<SongFormFooter
				hasChanges={false}
				isSubmitting={false}
				isEditing
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
				onDelete={onDelete}
			/>,
		);

		const deleteBtn = screen.getByTestId("delete-song-button");
		fireEvent.click(deleteBtn);

		// Now confirmation buttons should be present
		const cancelBtn = screen.getByTestId("delete-song-cancel");
		const confirmBtn = screen.getByTestId("delete-song-confirm");
		expect(cancelBtn).toBeTruthy();
		expect(confirmBtn).toBeTruthy();

		// Cancel hides confirmation
		fireEvent.click(cancelBtn);
		expect(screen.queryByTestId("delete-song-cancel")).toBeNull();

		// Re-open and confirm
		fireEvent.click(screen.getByTestId("delete-song-button"));
		fireEvent.click(screen.getByTestId("delete-song-confirm"));

		// Wait for onDelete to have been called
		expect(onDelete).toHaveBeenCalledTimes(ONE);
	});

	it("disables buttons while submitting", (): void => {
		const onDelete = vi.fn();
		render(
			<SongFormFooter
				hasChanges={false}
				isSubmitting
				isEditing
				onSave={vi.fn()}
				onReset={vi.fn()}
				onCancel={vi.fn()}
				onDelete={onDelete}
			/>,
		);

		const createBtn = screen.getByTestId("create-song-button");
		const resetBtn = screen.getByTestId("reset-song-button");
		const cancelBtn = screen.getByTestId("cancel-song-button");
		const deleteBtn = screen.getByTestId("delete-song-button");

		expect(createBtn.hasAttribute("disabled")).toBe(true);
		expect(resetBtn.hasAttribute("disabled")).toBe(true);
		expect(cancelBtn.hasAttribute("disabled")).toBe(true);
		expect(deleteBtn.hasAttribute("disabled")).toBe(true);
	});
});
