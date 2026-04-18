import { fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import ChordSelect from "./ChordSelect";

vi.mock("react-i18next");

const FIRST_OPTION_INDEX = 0;

/**
 * @param key - translation key
 * @param defaultValue - fallback value
 * @returns translated value or default
 */
function translateOrDefault(key: string, defaultValue?: string): string {
	return defaultValue ?? key;
}

/**
 * Resolves the chord dropdown and narrows it to `HTMLSelectElement`.
 *
 * @returns The rendered chord select element
 */
function getChordSelect(): HTMLSelectElement {
	const select = screen.getByTestId("chord-select");
	if (!(select instanceof HTMLSelectElement)) {
		throw new TypeError("Expected chord selector to be an HTMLSelectElement");
	}

	return select;
}

describe("chordSelect", () => {
	it("renders the song chords as selectable options", () => {
		// Arrange
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);

		// Act
		render(
			<ChordSelect
				songChords={["C -", "G 7"]}
				currentChordToken={undefined}
				onSelectChord={vi.fn()}
			/>,
		);
		const chordSelect = getChordSelect();
		const optionTexts = [...chordSelect.options].map((option) => option.textContent);

		// Assert
		expect(optionTexts).toStrictEqual(["Insert Chord", "C -", "G 7"]);
	});

	it("routes existing chord selections to onSelectChord", () => {
		// Arrange
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onSelectChord = vi.fn();

		// Act
		render(
			<ChordSelect
				songChords={["C -"]}
				currentChordToken={undefined}
				onSelectChord={onSelectChord}
			/>,
		);
		fireEvent.change(getChordSelect(), { target: { value: "C -" } });

		// Assert
		expect(onSelectChord).toHaveBeenCalledWith("C -");
	});

	it("does not call onSelectChord when the placeholder option remains selected", () => {
		// Arrange
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onSelectChord = vi.fn();

		// Act
		render(
			<ChordSelect
				songChords={["C -"]}
				currentChordToken={undefined}
				onSelectChord={onSelectChord}
			/>,
		);
		fireEvent.change(getChordSelect(), { target: { value: "" } });

		// Assert
		expect(onSelectChord).not.toHaveBeenCalled();
	});

	it("shows the current chord token as the selected default choice", () => {
		// Arrange
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);

		// Act
		render(
			<ChordSelect songChords={["C -", "G 7"]} currentChordToken="[G 7]" onSelectChord={vi.fn()} />,
		);

		// Assert
		expect(getChordSelect().value).toBe("G 7");
	});

	it("uses insert chord as the default action label when not editing", () => {
		// Arrange
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);

		// Act
		render(<ChordSelect songChords={[]} currentChordToken={undefined} onSelectChord={vi.fn()} />);

		// Assert
		expect(getChordSelect().options[FIRST_OPTION_INDEX]?.textContent).toBe("Insert Chord");
	});
});
