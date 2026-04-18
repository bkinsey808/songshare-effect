import { fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import type { SongKey } from "@/shared/song/songKeyOptions";

import SongFormFields from "./SongFormFields";

vi.mock("react-i18next");

const ONE_CALL = 1;

/**
 * Minimal multi-language picker mock used to keep SongFormFields tests focused.
 *
 * @returns Lightweight placeholder element
 */
function MockMultiLanguagePicker(): ReactElement {
	return <div data-testid="mock-multi-language-picker" />;
}

/**
 * Minimal tag input mock used to keep SongFormFields tests focused.
 *
 * @returns Lightweight placeholder element
 */
function MockTagInput(): ReactElement {
	return <div data-testid="mock-tag-input" />;
}

/**
 * Minimal song-key field mock used to assert its relative placement in the form.
 *
 * @returns Lightweight placeholder element
 */
function MockSongKeyFormField(): ReactElement {
	return <div data-testid="mock-song-key-form-field" />;
}

vi.mock(import("./language-picker/MultiLanguagePicker"), () => ({
	default: MockMultiLanguagePicker,
}));

vi.mock(import("@/react/tag/input/TagInput"), () => ({
	default: MockTagInput,
}));

vi.mock(import("./SongKeyFormField"), () => ({
	default: MockSongKeyFormField,
}));

type SongFormFieldsProps = React.ComponentProps<typeof SongFormFields>;

/**
 * Builds default props for SongFormFields component tests.
 *
 * @param overrides - Optional prop overrides for a specific test case
 * @returns Complete props object for the component
 */
function createProps(overrides: Partial<SongFormFieldsProps> = {}): SongFormFieldsProps {
	return {
		getFieldError: () => undefined,
		onSongNameBlur: () => undefined,
		songNameRef: createRef<HTMLInputElement>(),
		songSlugRef: createRef<HTMLInputElement>(),
		formValues: {
			song_name: "Amazing Grace",
			song_slug: "amazing-grace",
			lyrics: ["en"],
			script: [],
			translations: [],
			chords: [],
			key: "" satisfies SongKey | "",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			private_notes: "",
		},
		setFormValue: () => undefined,
		tags: [],
		setTags: () => undefined,
		onKeyChange: () => undefined,
		lyricChords: [],
		onOpenSongChordPicker: () => undefined,
		onEditSongChord: () => undefined,
		onRemoveSongChord: () => undefined,
		...overrides,
	};
}

describe("song form fields", () => {
	it("renders the song chords array directly below the song key field", () => {
		mockUseTranslation();

		render(
			<SongFormFields
				{...createProps({
					formValues: {
						...createProps().formValues,
						chords: ["I", "V 7", "vi m"],
					},
					lyricChords: ["I", "V 7", "vi m"],
				})}
			/>,
		);

		const songKeyField = screen.getByTestId("mock-song-key-form-field");
		const chordsField = screen.getByTestId("song-chords-array");

		expect(songKeyField.compareDocumentPosition(chordsField)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(within(chordsField).getByText("I")).toBeTruthy();
		expect(within(chordsField).getByText("V 7")).toBeTruthy();
		expect(within(chordsField).getByText("vi m")).toBeTruthy();
	});

	it("opens the full-page chord picker from the chords section", () => {
		mockUseTranslation();
		const onOpenSongChordPicker = vi.fn();

		render(<SongFormFields {...createProps({ onOpenSongChordPicker })} />);

		fireEvent.click(screen.getByTestId("open-song-chord-picker"));

		expect(onOpenSongChordPicker).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("shows an x button only for chords not currently in lyrics and removes them", () => {
		mockUseTranslation();
		const onRemoveSongChord = vi.fn();

		render(
			<SongFormFields
				{...createProps({
					formValues: {
						...createProps().formValues,
						chords: ["I", "V 7", "vi m"],
					},
					lyricChords: ["I", "V 7"],
					onRemoveSongChord,
				})}
			/>,
		);

		expect(screen.queryByLabelText("Remove unused chord I")).toBeNull();
		expect(screen.queryByLabelText("Remove unused chord V 7")).toBeNull();

		fireEvent.click(screen.getByLabelText("Remove unused chord vi m"));

		expect(onRemoveSongChord).toHaveBeenCalledWith("vi m");
	});

	it("opens the full-page picker when an unused chord chip is clicked", () => {
		mockUseTranslation();
		const onEditSongChord = vi.fn();

		render(
			<SongFormFields
				{...createProps({
					formValues: {
						...createProps().formValues,
						chords: ["I", "V 7", "vi m"],
					},
					lyricChords: ["I", "V 7"],
					onEditSongChord,
				})}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Edit unused chord vi m"));

		expect(onEditSongChord).toHaveBeenCalledWith("vi m");
		expect(screen.queryByLabelText("Edit unused chord I")).toBeNull();
	});

	it("shows an empty-state message when the song has no detected chords", () => {
		mockUseTranslation();

		render(<SongFormFields {...createProps()} />);

		expect(screen.getByTestId("song-chords-array").textContent).toContain(
			"No chords detected yet.",
		);
	});
});
