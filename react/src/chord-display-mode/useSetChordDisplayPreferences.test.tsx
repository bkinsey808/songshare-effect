import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makeCurrentUser from "@/react/auth/current-user/makeCurrentUser.test-util";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import saveChordDisplayPreferences from "./saveChordDisplayPreferences";
import useSetChordDisplayPreferences from "./useSetChordDisplayPreferences";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/current-user/useCurrentUser");
vi.mock("./saveChordDisplayPreferences");

const CATEGORY_RESULT_TEST_ID = "category-result";
const LETTER_RESULT_TEST_ID = "letter-result";
const SCALE_DEGREE_RESULT_TEST_ID = "scale-degree-result";
const FIRST_CALL_INDEX = 1;
const SECOND_CALL_INDEX = 2;
const SINGLE_CALL_COUNT = 1;

type StoreState = Readonly<{
	updateUserSessionUser: (update: Readonly<Record<string, string>>) => void;
}>;

/**
 * Installs a deterministic mocked app-store selector implementation for this file.
 *
 * @param updateUserSessionUser - Mocked store updater used by the hook
 * @returns Nothing
 */
function installStore(updateUserSessionUser: StoreState["updateUserSessionUser"]): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: StoreState) => unknown>(selector)({
			updateUserSessionUser,
		}),
	);
}

/**
 * Harness for useSetChordDisplayPreferences.
 *
 * Shows how UI code would call the returned updater with partial preference changes.
 *
 * @returns Rendered harness UI
 */
function Harness(): ReactElement {
	const setChordDisplayPreferences = useSetChordDisplayPreferences();

	return (
		<div>
			<button
				type="button"
				data-testid={CATEGORY_RESULT_TEST_ID}
				onClick={() => {
					void setChordDisplayPreferences({
						chordDisplayCategory: ChordDisplayCategory.scaleDegree,
					});
				}}
			>
				Update category
			</button>
			<button
				type="button"
				data-testid={LETTER_RESULT_TEST_ID}
				onClick={() => {
					void setChordDisplayPreferences({
						chordLetterDisplay: ChordLetterDisplay.german,
					});
				}}
			>
				Update letter
			</button>
			<button
				type="button"
				data-testid={SCALE_DEGREE_RESULT_TEST_ID}
				onClick={() => {
					void setChordDisplayPreferences({
						chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
					});
				}}
			>
				Update scale degree
			</button>
		</div>
	);
}

describe("useSetChordDisplayPreferences — Harness", () => {
	it("updates preferences from UI event handlers", async () => {
		// Arrange
		const updateUserSessionUser = vi.fn();
		installStore(updateUserSessionUser);
		vi.mocked(useCurrentUser).mockReturnValue(makeCurrentUser());
		vi.mocked(saveChordDisplayPreferences).mockResolvedValue({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			chordLetterDisplay: ChordLetterDisplay.german,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
		});
		render(<Harness />);

		// Act
		fireEvent.click(screen.getByTestId(CATEGORY_RESULT_TEST_ID));
		fireEvent.click(screen.getByTestId(LETTER_RESULT_TEST_ID));
		fireEvent.click(screen.getByTestId(SCALE_DEGREE_RESULT_TEST_ID));
		await Promise.resolve();
		await Promise.resolve();

		// Assert
		expect(vi.mocked(saveChordDisplayPreferences)).toHaveBeenCalledWith({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		});
		expect(vi.mocked(saveChordDisplayPreferences)).toHaveBeenCalledWith({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.german,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		});
		expect(vi.mocked(saveChordDisplayPreferences)).toHaveBeenCalledWith({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
		});
	});
});

describe("useSetChordDisplayPreferences — renderHook", () => {
	it("returns early when there is no current user", async () => {
		// Arrange
		const updateUserSessionUser = vi.fn();
		vi.mocked(saveChordDisplayPreferences).mockReset();
		installStore(updateUserSessionUser);
		vi.mocked(useCurrentUser).mockReturnValue(undefined);

		// Act
		const { result } = renderHook(() => useSetChordDisplayPreferences());
		await result.current({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
		});

		// Assert
		expect(updateUserSessionUser).not.toHaveBeenCalled();
		expect(vi.mocked(saveChordDisplayPreferences)).not.toHaveBeenCalled();
	});

	it("optimistically updates and then applies saved preferences", async () => {
		// Arrange
		const updateUserSessionUser = vi.fn();
		vi.mocked(saveChordDisplayPreferences).mockReset();
		installStore(updateUserSessionUser);
		vi.mocked(useCurrentUser).mockReturnValue(makeCurrentUser());
		vi.mocked(saveChordDisplayPreferences).mockResolvedValue({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			chordLetterDisplay: ChordLetterDisplay.german,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.solfege,
		});

		// Act
		const { result } = renderHook(() => useSetChordDisplayPreferences());
		await result.current({
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.solfege,
		});

		// Assert
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(FIRST_CALL_INDEX, {
			chord_display_category: ChordDisplayCategory.letters,
			chord_letter_display: ChordLetterDisplay.standard,
			chord_scale_degree_display: ChordScaleDegreeDisplay.solfege,
		});
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(SECOND_CALL_INDEX, {
			chord_display_category: ChordDisplayCategory.scaleDegree,
			chord_letter_display: ChordLetterDisplay.german,
			chord_scale_degree_display: ChordScaleDegreeDisplay.solfege,
		});
	});

	it("logs and keeps the optimistic update when persistence fails", async () => {
		// Arrange
		const updateUserSessionUser = vi.fn();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		vi.mocked(saveChordDisplayPreferences).mockReset();
		installStore(updateUserSessionUser);
		vi.mocked(useCurrentUser).mockReturnValue(makeCurrentUser());
		vi.mocked(saveChordDisplayPreferences).mockRejectedValue(new Error("network fail"));

		try {
			// Act
			const { result } = renderHook(() => useSetChordDisplayPreferences());
			await result.current({
				chordLetterDisplay: ChordLetterDisplay.german,
			});

			// Assert
			expect(updateUserSessionUser).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Failed to persist chord display preferences:",
				expect.any(Error),
			);
		} finally {
			consoleErrorSpy.mockRestore();
		}
	});
});
