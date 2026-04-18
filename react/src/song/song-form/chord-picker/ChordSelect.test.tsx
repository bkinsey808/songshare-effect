import { fireEvent, render, screen, within } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import ChordSelect from "./ChordSelect";

vi.mock("react-i18next");

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
	it("renders existing chords first and the picker action last", () => {
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
				existingChordTokens={["[C -]", "[G 7]"]}
				currentChordToken={undefined}
				isEditingChord={false}
				onSelectChord={vi.fn()}
				onOpenChordPicker={vi.fn()}
			/>,
		);
		const chordSelect = getChordSelect();
		const options = within(chordSelect).getAllByRole("option");

		// Assert
		expect(options.map((option) => option.textContent)).toStrictEqual([
			"[C -]",
			"[G 7]",
			"Insert Chord",
		]);
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
				existingChordTokens={["[C -]"]}
				currentChordToken={undefined}
				isEditingChord={false}
				onSelectChord={onSelectChord}
				onOpenChordPicker={vi.fn()}
			/>,
		);
		fireEvent.change(getChordSelect(), { target: { value: "[C -]" } });

		// Assert
		expect(onSelectChord).toHaveBeenCalledWith("[C -]");
	});

	it("opens the picker from the final action option and shows the edit label when editing", () => {
		// Arrange
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onOpenChordPicker = vi.fn();

		// Act
		render(
			<ChordSelect
				existingChordTokens={["[C -]"]}
				currentChordToken={undefined}
				isEditingChord
				onSelectChord={vi.fn()}
				onOpenChordPicker={onOpenChordPicker}
			/>,
		);
		fireEvent.change(getChordSelect(), {
			target: { value: "__open-chord-picker__" },
		});

		// Assert
		expect(screen.getByRole("option", { name: "Edit Chord" })).toBeTruthy();
		expect(onOpenChordPicker).toHaveBeenCalledOnce();
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
			<ChordSelect
				existingChordTokens={["[C -]", "[G 7]"]}
				currentChordToken="[G 7]"
				isEditingChord={false}
				onSelectChord={vi.fn()}
				onOpenChordPicker={vi.fn()}
			/>,
		);

		// Assert
		expect(getChordSelect().value).toBe("[G 7]");
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
		render(
			<ChordSelect
				existingChordTokens={[]}
				currentChordToken={undefined}
				isEditingChord={false}
				onSelectChord={vi.fn()}
				onOpenChordPicker={vi.fn()}
			/>,
		);

		// Assert
		expect(screen.getByRole("option", { name: "Insert Chord" })).toBeTruthy();
	});
});
