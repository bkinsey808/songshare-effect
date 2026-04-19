import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import AnnotatedTextField from "./AnnotatedTextField";

const SONG_KEY_C = "C" as const;
const TEXT_CLASS_NAME = "text-body";
const ANNOTATION_CLASS_NAME = "annotation-body";
const ANNOTATED_TEXT = "Hello [C -]world\n{es}Hola";
const STRIPPED_TEXT = "Hello [C -] world";
const INLINE_CHORD_TEXT = "Hello [C -]world";
const INLINE_LANGUAGE_TEXT = "{es}Hola";
const SOLFEGE_ANNOTATION = "Do -";
const LANGUAGE_ANNOTATION = "es";
const STRIPPED_RESULT_TEXT = "Hello  world";
const TWO_ANNOTATIONS = 2;
const THREE_TEXT_SPANS = 3;
const ZERO_ANNOTATIONS = 0;

const cases = [
	{
		name: "renders floating chord and language annotations instead of inline tokens",
		text: ANNOTATED_TEXT,
		extractChords: true,
		extractLanguageTags: true,
		expectedPresentTexts: [SOLFEGE_ANNOTATION, LANGUAGE_ANNOTATION],
		expectedAbsentTexts: [INLINE_CHORD_TEXT, INLINE_LANGUAGE_TEXT],
		expectedAnnotationCount: TWO_ANNOTATIONS,
		expectedTextSpanCount: THREE_TEXT_SPANS,
		expectedTextContent: "Hello Do -worldesHola",
	},
	{
		name: "renders stripped plain text when chord extraction is disabled",
		text: STRIPPED_TEXT,
		extractChords: false,
		extractLanguageTags: false,
		expectedPresentTexts: [],
		expectedAbsentTexts: [SOLFEGE_ANNOTATION],
		expectedAnnotationCount: ZERO_ANNOTATIONS,
		expectedTextSpanCount: 1,
		expectedTextContent: STRIPPED_RESULT_TEXT,
	},
] as const;

describe("annotated text field", () => {
	it.each(cases)(
		"$name",
		({
			text,
			extractChords,
			extractLanguageTags,
			expectedPresentTexts,
			expectedAbsentTexts,
			expectedAnnotationCount,
			expectedTextSpanCount,
			expectedTextContent,
		}) => {
			// Arrange
			const { container } = render(
				<AnnotatedTextField
					text={text}
					extractChords={extractChords}
					extractLanguageTags={extractLanguageTags}
					chordDisplayMode={ChordDisplayMode.solfege}
					songKey={SONG_KEY_C}
					textClassName={TEXT_CLASS_NAME}
					annotationClassName={ANNOTATION_CLASS_NAME}
				/>,
			);

			// Assert
			for (const expectedPresentText of expectedPresentTexts) {
				expect(screen.getByText(expectedPresentText)).toBeTruthy();
			}
			for (const expectedAbsentText of expectedAbsentTexts) {
				expect(screen.queryByText(expectedAbsentText)).toBeNull();
			}
			expect(container.querySelectorAll(`.${ANNOTATION_CLASS_NAME}`)).toHaveLength(
				expectedAnnotationCount,
			);
			expect(container.querySelectorAll(`.${TEXT_CLASS_NAME}`)).toHaveLength(expectedTextSpanCount);
			expect(container.textContent).toBe(expectedTextContent);
		},
	);
});
