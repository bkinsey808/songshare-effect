import { fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { Slide } from "@/react/song/song-form/song-form-types";

import SlideNameCell from "./SlideNameCell";

vi.mock("react-i18next");

const SLIDE_ID = "slide-1";
const BASE_SLIDE: Slide = {
	slide_name: "Slide 1",
	field_data: {},
};

/**
 * @param key - translation key
 * @param defaultValue - fallback value
 * @returns translated value or default
 */
function translateOrDefault(key: string, defaultValue?: string): string {
	return defaultValue ?? key;
}

type Props = React.ComponentProps<typeof SlideNameCell>;

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
 * Resolves the chord dropdown and narrows it to `HTMLSelectElement`.
 *
 * @returns The rendered chord select element, if present
 */
function queryChordSelect(): HTMLSelectElement | undefined {
	const select = screen.queryByTestId("chord-select");
	if (select === null) {
		return undefined;
	}
	if (!(select instanceof HTMLSelectElement)) {
		throw new TypeError("Expected chord selector to be an HTMLSelectElement");
	}

	return select;
}

/**
 * Builds complete props for rendering `SlideNameCell` in tests.
 *
 * @param overrides - Partial prop overrides for the scenario under test
 * @returns Fully populated slide-name-cell props
 */
function makeProps(overrides: Partial<Props> = {}): Props {
	return {
		slideId: SLIDE_ID,
		slide: BASE_SLIDE,
		editSlideName: vi.fn(),
		setSlideOrder: vi.fn(),
		slideOrder: [SLIDE_ID],
		duplicateSlide: vi.fn(),
		deleteSlide: vi.fn(),
		idx: 0,
		confirmingDelete: false,
		setConfirmingDelete: vi.fn(),
		globalIsDragging: false,
		attributes: forceCast<Props["attributes"]>({}),
		listeners: undefined,
		isDuplicateRow: false,
		hasLyrics: true,
		currentChordToken: undefined,
		songChords: ["[C -]"],
		onSelectChord: vi.fn(),
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

describe("slideNameCell", () => {
	it("shows the script language when the script field is active", () => {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const props = makeProps({
			activeLanguageField: "script",
			lyricsSelectedLanguageCode: "en",
			scriptSelectedLanguageCode: "grc",
		});

		render(
			<table>
				<tbody>
					<tr>
						<SlideNameCell {...props} />
					</tr>
				</tbody>
			</table>,
		);

		expect(getLanguageSelect().value).toBe("grc");
		expect(screen.queryByRole("group")).toBeNull();
		expect(screen.queryByRole("option", { name: /english/i })).toBeNull();
		expect(screen.getByRole("option", { name: /ancient greek/i })).toBeTruthy();
	});

	it("falls back to the lyrics language when no active field is set", () => {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const props = makeProps({
			lyricsSelectedLanguageCode: "en",
			scriptSelectedLanguageCode: "grc",
		});

		render(
			<table>
				<tbody>
					<tr>
						<SlideNameCell {...props} />
					</tr>
				</tbody>
			</table>,
		);

		expect(getLanguageSelect().value).toBe("en");
		expect(screen.queryByRole("group")).toBeNull();
		expect(screen.getByRole("option", { name: /english/i })).toBeTruthy();
		expect(screen.queryByRole("option", { name: /ancient greek/i })).toBeNull();
	});

	it("routes language changes to the active script field", () => {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const onSelectLyricsLanguage = vi.fn();
		const onSelectScriptLanguage = vi.fn();
		const props = makeProps({
			activeLanguageField: "script",
			scriptSelectedLanguageCode: "grc",
			onSelectLyricsLanguage,
			onSelectScriptLanguage,
		});

		render(
			<table>
				<tbody>
					<tr>
						<SlideNameCell {...props} />
					</tr>
				</tbody>
			</table>,
		);

		fireEvent.change(getLanguageSelect(), { target: { value: "arc" } });

		expect(onSelectScriptLanguage).toHaveBeenCalledWith("arc");
		expect(onSelectLyricsLanguage).not.toHaveBeenCalled();
	});

	it("hides the chord pulldown when the script grid is active", () => {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const props = makeProps({
			activeLanguageField: "script",
		});

		render(
			<table>
				<tbody>
					<tr>
						<SlideNameCell {...props} />
					</tr>
				</tbody>
			</table>,
		);

		expect(queryChordSelect()).toBeUndefined();
	});

	it("hides the language pulldown when the active script field has only one language", () => {
		vi.mocked(useTranslation).mockReturnValue(
			forceCast<ReturnType<typeof useTranslation>>({
				t: translateOrDefault,
				i18n: { changeLanguage: vi.fn(), language: "en" },
			}),
		);
		const props = makeProps({
			activeLanguageField: "script",
			lyricsLanguages: ["en", "es"],
			scriptLanguages: ["grc"],
		});

		render(
			<table>
				<tbody>
					<tr>
						<SlideNameCell {...props} />
					</tr>
				</tbody>
			</table>,
		);

		expect(screen.queryByTestId("slide-name-language-select")).toBeNull();
	});
});
