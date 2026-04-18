import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SlideNameLanguageSelect from "./SlideNameLanguageSelect";

const NONE = 0;

type Props = React.ComponentProps<typeof SlideNameLanguageSelect>;

/**
 * Resolves the language dropdown and narrows it to `HTMLSelectElement`.
 *
 * @returns The rendered language select element
 */
function getLanguageSelect(): HTMLSelectElement {
	const select = screen.getByTestId("slide-name-language-select");
	if (!(select instanceof HTMLSelectElement)) {
		throw new TypeError("Expected language selector to be an HTMLSelectElement");
	}

	return select;
}

/**
 * Builds complete props for rendering `SlideNameLanguageSelect` in tests.
 *
 * @param overrides - Partial prop overrides for the scenario under test
 * @returns Fully populated language-select props
 */
function makeProps(overrides: Partial<Props> = {}): Props {
	return {
		hasLyrics: true,
		hasScript: true,
		lyricsLanguages: ["en", "es"],
		scriptLanguages: ["grc", "arc"],
		activeLanguageField: undefined,
		lyricsSelectedLanguageCode: undefined,
		onSelectLyricsLanguage: vi.fn(),
		scriptSelectedLanguageCode: undefined,
		onSelectScriptLanguage: vi.fn(),
		...overrides,
	};
}

describe("slideNameLanguageSelect", () => {
	it("shows lyrics languages when the lyrics field is active", () => {
		// Arrange
		const props = makeProps({
			activeLanguageField: "lyrics",
			lyricsSelectedLanguageCode: "es",
		});

		// Act
		render(<SlideNameLanguageSelect {...props} />);

		// Assert
		expect(getLanguageSelect().value).toBe("es");
		expect(screen.getByRole("option", { name: "English" })).toBeTruthy();
		expect(screen.getByRole("option", { name: "Spanish" })).toBeTruthy();
		expect(screen.queryByRole("option", { name: "Ancient Greek" })).toBeNull();
	});

	it("shows script languages and routes changes to the script handler when the script field is active", () => {
		// Arrange
		const onSelectLyricsLanguage = vi.fn();
		const onSelectScriptLanguage = vi.fn();
		const props = makeProps({
			activeLanguageField: "script",
			scriptSelectedLanguageCode: "grc",
			onSelectLyricsLanguage,
			onSelectScriptLanguage,
		});

		// Act
		render(<SlideNameLanguageSelect {...props} />);
		fireEvent.change(getLanguageSelect(), { target: { value: "arc" } });

		// Assert
		expect(getLanguageSelect().value).toBe("grc");
		expect(screen.getByRole("option", { name: "Ancient Greek" })).toBeTruthy();
		expect(screen.getByRole("option", { name: "Aramaic" })).toBeTruthy();
		expect(screen.queryByRole("option", { name: "English" })).toBeNull();
		expect(onSelectScriptLanguage).toHaveBeenCalledWith("arc");
		expect(onSelectLyricsLanguage).not.toHaveBeenCalled();
	});

	it("falls back to the script languages when only the script field has a selected language token", () => {
		// Arrange
		const props = makeProps({
			lyricsSelectedLanguageCode: undefined,
			scriptSelectedLanguageCode: "grc",
		});

		// Act
		render(<SlideNameLanguageSelect {...props} />);

		// Assert
		expect(getLanguageSelect().value).toBe("grc");
		expect(screen.getByRole("option", { name: "Ancient Greek" })).toBeTruthy();
		expect(screen.queryByRole("option", { name: "English" })).toBeNull();
	});

	it("hides the dropdown when there are no lyrics or script fields", () => {
		// Arrange
		const props = makeProps({
			hasLyrics: false,
			hasScript: false,
		});

		// Act
		const { container } = render(<SlideNameLanguageSelect {...props} />);

		// Assert
		expect(screen.queryByTestId("slide-name-language-select")).toBeNull();
		expect(container.childElementCount).toBe(NONE);
	});

	it("hides the dropdown when the active field has only one language", () => {
		// Arrange
		const props = makeProps({
			activeLanguageField: "script",
			scriptLanguages: ["grc"],
		});

		// Act
		const { container } = render(<SlideNameLanguageSelect {...props} />);

		// Assert
		expect(screen.queryByTestId("slide-name-language-select")).toBeNull();
		expect(container.childElementCount).toBe(NONE);
	});
});
