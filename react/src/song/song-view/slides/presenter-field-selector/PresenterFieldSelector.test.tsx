import { cleanup, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import {
	ChordDisplayMode,
	type ChordDisplayModeType,
} from "@/shared/user/chord-display/effectiveChordDisplayMode";

import PresenterFieldSelector from "./PresenterFieldSelector";

vi.mock("react-i18next");

type RenderPresenterFieldSelectorOptions = Readonly<{
	availableFields?: readonly string[];
	selectedFields?: readonly string[];
	showChords?: boolean;
	chordDisplayMode?: ChordDisplayModeType;
	showLanguageTags?: boolean;
}>;

type RenderPresenterFieldSelectorResult = ReturnType<typeof render> &
	Readonly<{
		onToggleField: ReturnType<typeof vi.fn>;
		onToggleChords: ReturnType<typeof vi.fn>;
		onSetChordDisplayMode: ReturnType<typeof vi.fn>;
		onToggleLanguageTags: ReturnType<typeof vi.fn>;
	}>;

/**
 * Render the presenter field selector with sensible defaults for focused tests.
 *
 * @param availableFields - Field keys to expose in the selector UI
 * @param selectedFields - Field keys that start selected in the rendered selector
 * @param showChords - Whether the selector should start with chords enabled
 * @param chordDisplayMode - Initial chord notation mode shown in the selector
 * @param showLanguageTags - Whether the selector should start with language tags enabled
 * @returns Render utilities and callback spies for assertions
 */
function renderPresenterFieldSelector({
	availableFields = ["lyrics", "es"],
	selectedFields = ["lyrics"],
	showChords = true,
	chordDisplayMode = ChordDisplayMode.roman,
	showLanguageTags = false,
}: RenderPresenterFieldSelectorOptions = {}): RenderPresenterFieldSelectorResult {
	const onToggleField = vi.fn();
	const onToggleChords = vi.fn();
	const onSetChordDisplayMode = vi.fn();
	const onToggleLanguageTags = vi.fn();

	const renderResult = render(
		<PresenterFieldSelector
			availableFields={availableFields}
			selectedFields={selectedFields}
			showChords={showChords}
			chordDisplayMode={chordDisplayMode}
			showLanguageTags={showLanguageTags}
			onToggleField={onToggleField}
			onToggleChords={onToggleChords}
			onSetChordDisplayMode={onSetChordDisplayMode}
			onToggleLanguageTags={onToggleLanguageTags}
		/>,
	);

	return {
		...renderResult,
		onSetChordDisplayMode,
		onToggleChords,
		onToggleField,
		onToggleLanguageTags,
	};
}

describe("presenter field selector", () => {
	it("does not render when there are no available fields", () => {
		// Arrange
		mockUseTranslation();

		// Act
		const { queryByText } = renderPresenterFieldSelector({
			availableFields: [],
			selectedFields: [],
		});

		// Assert
		expect(queryByText("Presenter Options")).toBeNull();
		cleanup();
	});

	it("renders field labels and wires the presenter option callbacks", () => {
		// Arrange
		mockUseTranslation();
		const {
			getByRole,
			onSetChordDisplayMode,
			onToggleChords,
			onToggleField,
			onToggleLanguageTags,
		} = renderPresenterFieldSelector({
			showLanguageTags: true,
		});

		// Act
		fireEvent.click(getByRole("button", { name: "Spanish" }));
		fireEvent.click(getByRole("button", { name: "Off" }));
		fireEvent.click(getByRole("button", { name: "Solfege" }));
		fireEvent.click(getByRole("button", { name: "On" }));

		// Assert
		expect(getByRole("button", { name: "Lyrics" })).toBeTruthy();
		expect(getByRole("button", { name: "Spanish" })).toBeTruthy();
		expect(onToggleField).toHaveBeenCalledWith("es");
		expect(onToggleChords).toHaveBeenCalledOnce();
		expect(onSetChordDisplayMode).toHaveBeenCalledWith(ChordDisplayMode.solfege);
		expect(onToggleLanguageTags).toHaveBeenCalledOnce();
		cleanup();
	});

	it("hides chord mode buttons when chords are turned off", () => {
		// Arrange
		mockUseTranslation();

		// Act
		const { getByRole, queryByRole } = renderPresenterFieldSelector({
			showChords: false,
			showLanguageTags: true,
		});

		// Assert
		expect(getByRole("button", { name: "Off" })).toBeTruthy();
		expect(getByRole("button", { name: "On" })).toBeTruthy();
		expect(queryByRole("button", { name: "Roman" })).toBeNull();
		expect(queryByRole("button", { name: "Solfege" })).toBeNull();
		cleanup();
	});
});
