import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import makeCurrentUser from "@/react/auth/current-user/makeCurrentUser.test-util";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import useChordDisplayModePreference from "./useChordDisplayModePreference";
import useChordDisplayModeSelect from "./useChordDisplayModeSelect";
import useSetChordDisplayPreferences from "./useSetChordDisplayPreferences";

vi.mock("@/react/auth/current-user/useCurrentUser");
vi.mock("./useChordDisplayModePreference");
vi.mock("./useSetChordDisplayPreferences");

const CATEGORY_BUTTON_TEST_ID = "category-button";
const LETTER_BUTTON_TEST_ID = "letter-button";
const SCALE_DEGREE_BUTTON_TEST_ID = "scale-degree-button";
const USER_RESULT_TEST_ID = "user-result";

/**
 * Harness for useChordDisplayModeSelect.
 *
 * Shows how UI code wires the returned change handlers to select-like events.
 *
 * @returns Rendered harness UI
 */
function Harness(): ReactElement {
	const {
		currentUser,
		handleCategoryChange,
		handleLetterDisplayChange,
		handleScaleDegreeDisplayChange,
	} = useChordDisplayModeSelect();

	return (
		<div>
			<div data-testid={USER_RESULT_TEST_ID}>{currentUser?.email ?? ""}</div>
			<button
				type="button"
				data-testid={CATEGORY_BUTTON_TEST_ID}
				onClick={() => {
					handleCategoryChange(
						forceCast<React.ChangeEvent<HTMLSelectElement>>({
							target: { value: ChordDisplayCategory.scaleDegree },
						}),
					);
				}}
			>
				Update category
			</button>
			<button
				type="button"
				data-testid={LETTER_BUTTON_TEST_ID}
				onClick={() => {
					handleLetterDisplayChange(
						forceCast<React.ChangeEvent<HTMLSelectElement>>({
							target: { value: ChordLetterDisplay.german },
						}),
					);
				}}
			>
				Update letter
			</button>
			<button
				type="button"
				data-testid={SCALE_DEGREE_BUTTON_TEST_ID}
				onClick={() => {
					handleScaleDegreeDisplayChange(
						forceCast<React.ChangeEvent<HTMLSelectElement>>({
							target: { value: ChordScaleDegreeDisplay.sargam },
						}),
					);
				}}
			>
				Update scale degree
			</button>
		</div>
	);
}

describe("useChordDisplayModeSelect — Harness", () => {
	it("wires returned handlers to UI events", () => {
		// Arrange
		const setChordDisplayPreferences = vi.fn();
		vi.mocked(useCurrentUser).mockReturnValue(makeCurrentUser());
		vi.mocked(useChordDisplayModePreference).mockReturnValue({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordDisplayMode: "letters",
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		});
		vi.mocked(useSetChordDisplayPreferences).mockReturnValue(setChordDisplayPreferences);
		render(<Harness />);

		// Act
		fireEvent.click(screen.getByTestId(CATEGORY_BUTTON_TEST_ID));
		fireEvent.click(screen.getByTestId(LETTER_BUTTON_TEST_ID));
		fireEvent.click(screen.getByTestId(SCALE_DEGREE_BUTTON_TEST_ID));

		// Assert
		expect(screen.getByTestId(USER_RESULT_TEST_ID).textContent).toBe("user@example.com");
		expect(setChordDisplayPreferences).toHaveBeenCalledWith({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
		});
		expect(setChordDisplayPreferences).toHaveBeenCalledWith({
			chordLetterDisplay: ChordLetterDisplay.german,
		});
		expect(setChordDisplayPreferences).toHaveBeenCalledWith({
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
		});
	});
});

describe("useChordDisplayModeSelect — renderHook", () => {
	it("returns current values from the preference hook", () => {
		// Arrange
		vi.mocked(useCurrentUser).mockReturnValue(makeCurrentUser());
		vi.mocked(useChordDisplayModePreference).mockReturnValue({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			chordLetterDisplay: ChordLetterDisplay.german,
			chordDisplayMode: "solfege",
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.solfege,
		});
		vi.mocked(useSetChordDisplayPreferences).mockReturnValue(vi.fn());

		// Act
		const { result } = renderHook(() => useChordDisplayModeSelect());

		// Assert
		expect(result.current.currentUser?.email).toBe("user@example.com");
		expect(result.current.chordDisplayCategory).toBe(ChordDisplayCategory.scaleDegree);
		expect(result.current.chordLetterDisplay).toBe(ChordLetterDisplay.german);
		expect(result.current.chordScaleDegreeDisplay).toBe(ChordScaleDegreeDisplay.solfege);
	});
});
