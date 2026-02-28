import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";

import CommunityForm from "./CommunityForm";
import useCommunityForm from "./useCommunityForm";

vi.mock("react-i18next");
vi.mock("./useCommunityForm");

describe("community form", () => {
	it("renders create form and handles cancel", () => {
		mockUseTranslation();

		const onCancelClick = vi.fn();
		const onNameChange = vi.fn();
		const onSlugChange = vi.fn();

		vi.mocked(useCommunityForm).mockReturnValue(
			forceCast<ReturnType<typeof useCommunityForm>>({
				formValues: {
					name: "Name",
					slug: "slug",
					description: "",
					is_public: false,
					public_notes: "",
					private_notes: "",
				},
				isEditing: false,
				isSaving: false,
				error: undefined,
				onNameChange,
				onSlugChange,
				onDescriptionChange: vi.fn(),
				onPublicChange: vi.fn(),
				onPublicNotesChange: vi.fn(),
				onPrivateNotesChange: vi.fn(),
				onFormSubmit: vi.fn(),
				onCancelClick,
				hasUnsavedChanges: false,
				formRef: { current: undefined },
				getFieldError: vi.fn(),
				submitButtonLabel: "Create Community",
			}),
		);

		render(<CommunityForm />);

		expect(screen.getByRole("heading", { name: "Create Community" })).toBeDefined();
		expect(screen.getByLabelText("Community Name")).toBeDefined();

		const cancel = screen.getByText("Cancel");
		fireEvent.click(cancel);
		expect(onCancelClick).toHaveBeenCalledWith(expect.anything());
	});

	it("shows error and disables submit when saving", () => {
		mockUseTranslation();

		const onCancelClick = vi.fn();

		vi.mocked(useCommunityForm).mockReturnValue(
			forceCast<ReturnType<typeof useCommunityForm>>({
				formValues: {
					name: "Name",
					slug: "slug",
					description: "",
					is_public: false,
					public_notes: "",
					private_notes: "",
				},
				isEditing: false,
				isSaving: true,
				error: "boom",
				onNameChange: vi.fn(),
				onSlugChange: vi.fn(),
				onDescriptionChange: vi.fn(),
				onPublicChange: vi.fn(),
				onPublicNotesChange: vi.fn(),
				onPrivateNotesChange: vi.fn(),
				onFormSubmit: vi.fn(),
				onCancelClick,
				hasUnsavedChanges: false,
				formRef: { current: undefined },
				getFieldError: vi.fn(),
				submitButtonLabel: "Saving...",
			}),
		);

		render(<CommunityForm />);

		expect(screen.getByText("boom")).toBeDefined();
		const submitBtn = forceCast<HTMLButtonElement>(
			screen.getByRole("button", { name: "Saving..." }),
		);
		expect(submitBtn).toBeDefined();
		expect(submitBtn.disabled).toBe(true);
	});
});
