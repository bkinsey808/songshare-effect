import { render, screen } from "@testing-library/react";
import { createRef, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import type { SongFormValues, UseSongFormReturn } from "@/react/song/song-form/song-form-types";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import ChordPicker from "./chord-picker/ChordPicker";
import CollapsibleSection from "./CollapsibleSection";
import SlidesGridView from "./grid-editor/SlidesGridView";
import SlidesEditor from "./slides-editor/SlidesEditor";
import SongForm from "./SongForm";
import SongFormFields from "./SongFormFields";
import SongFormFooter from "./SongFormFooter";
import useSongForm from "./use-song-form/useSongForm";

/**
 * Minimal mock replacement for the real `ChordPicker` used in the
 * `SongForm` tests. Keeps the render tree light while preserving the
 * component slot used by the parent.
 *
 * @returns Simple test element with a stable `data-testid`
 */
function MockChordPicker(): ReactElement {
	return <div data-testid="mock-chord-picker" />;
}

/**
 * Minimal CollapsibleSection mock that simply renders children. Tests
 * that depend on structural composition can rely on this lightweight
 * replacement instead of the full implementation.
 *
 * @param children - Optional React children to render inside the mock
 * @returns Rendered children wrapped in a `div` for test queries
 */
function MockCollapsibleSection({ children }: Readonly<{ children?: ReactNode }>): ReactElement {
	return <div>{children}</div>;
}

/**
 * Mock SlidesGridView used in tests to avoid heavy grid rendering.
 *
 * @returns A simple element with `data-testid="mock-slides-grid-view"`
 */
function MockSlidesGridView(): ReactElement {
	return <div data-testid="mock-slides-grid-view" />;
}

/**
 * Minimal SlidesEditor mock used to keep SongForm tests focused.
 *
 * @returns A simple element with `data-testid="mock-slides-editor"`
 */
function MockSlidesEditor(): ReactElement {
	return <div data-testid="mock-slides-editor" />;
}

/**
 * Minimal SongFormFields mock providing a stable `data-testid`.
 *
 * @returns A simple element with `data-testid="mock-song-form-fields"`
 */
function MockSongFormFields(): ReactElement {
	return <div data-testid="mock-song-form-fields" />;
}

/**
 * Minimal SongFormFooter mock providing a stable `data-testid`.
 *
 * @returns A simple element with `data-testid="mock-song-form-footer"`
 */
function MockSongFormFooter(): ReactElement {
	return <div data-testid="mock-song-form-footer" />;
}

vi.mock("react-i18next");
vi.mock("./chord-picker/ChordPicker");
vi.mock("./CollapsibleSection");
vi.mock("./grid-editor/SlidesGridView");
vi.mock("./slides-editor/SlidesEditor");
vi.mock("./SongFormFields");
vi.mock("./SongFormFooter");
vi.mock("./use-song-form/useSongForm");

/**
 * Replace heavy child components with minimal mocks so this test exercises only SongForm.
 *
 * @returns void
 */
function installChildComponentMocks(): void {
	vi.mocked(ChordPicker).mockImplementation(MockChordPicker);
	vi.mocked(CollapsibleSection).mockImplementation(MockCollapsibleSection);
	vi.mocked(SlidesGridView).mockImplementation(MockSlidesGridView);
	vi.mocked(SlidesEditor).mockImplementation(MockSlidesEditor);
	vi.mocked(SongFormFields).mockImplementation(MockSongFormFields);
	vi.mocked(SongFormFooter).mockImplementation(MockSongFormFooter);
}

/**
 * Build a complete mocked `useSongForm` return value for SongForm tests.
 *
 * @param overrides - Optional fields to override for a specific test case
 * @returns Fully populated `UseSongFormReturn`
 */
function createMockSongFormReturn(overrides: Partial<UseSongFormReturn> = {}): UseSongFormReturn {
	const formValues: SongFormValues = {
		song_name: "Test Song",
		song_slug: "test-song",
		lyrics: ["en"],
		script: [],
		translations: [],
		chords: [],
		key: "",
		short_credit: "",
		long_credit: "",
		public_notes: "",
		private_notes: "",
	};

	return {
		getFieldError: () => undefined,
		isSubmitting: false,
		isLoadingData: false,
		submitError: undefined,
		slideOrder: ["slide-1"],
		slides: {
			"slide-1": {
				slide_name: "Slide 1",
				field_data: {},
			},
		},
		fields: ["lyrics"],
		setSlideOrder: () => undefined,
		setSlides: () => undefined,
		handleFormSubmit: () => promiseResolved(undefined),
		formRef: createRef<HTMLFormElement>(),
		resetForm: () => undefined,
		songNameRef: createRef<HTMLInputElement>(),
		songSlugRef: createRef<HTMLInputElement>(),
		formValues,
		setFormValue: <Field extends keyof SongFormValues>(
			_field: Field,
			_value: SongFormValues[Field],
		): void => undefined,
		isFormFieldsExpanded: true,
		setIsFormFieldsExpanded: () => undefined,
		isSlidesExpanded: true,
		setIsSlidesExpanded: () => undefined,
		isGridExpanded: true,
		setIsGridExpanded: () => undefined,
		handleSongNameBlur: () => undefined,
		handleSave: () => undefined,
		handleCancel: () => undefined,
		handleDelete: () => promiseResolved(undefined),
		hasChanges: false,
		tags: [],
		setTags: () => undefined,
		isEditing: true,
		pendingChordPickerRequest: undefined,
		openChordPicker: () => undefined,
		closeChordPicker: () => undefined,
		insertChordFromPicker: () => undefined,
		...overrides,
	};
}

describe("song form", () => {
	it("renders a visible submit error banner when saving fails", (): void => {
		// Arrange
		vi.resetAllMocks();
		mockUseTranslation();
		installChildComponentMocks();
		vi.mocked(useSongForm).mockReturnValue(
			forceCast<ReturnType<typeof useSongForm>>(
				createMockSongFormReturn({
					submitError: "Song slug already exists",
				}),
			),
		);

		// Act
		render(<SongForm />);

		// Assert
		expect(screen.getByTestId("song-form-submit-error").textContent).toContain(
			"Song slug already exists",
		);
	});
});
