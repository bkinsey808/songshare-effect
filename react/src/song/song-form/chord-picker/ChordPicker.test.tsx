import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import type { SongKey } from "@/shared/song/songKeyOptions";

import ChordPicker from "./ChordPicker";
import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";
import formatSelectedRootLabel from "@/react/music/root-picker/formatSelectedRootLabel";

const ONE_CALL = 1;
const MIN_INTERVAL_MATCH_COUNT = 0;
const DEFAULT_MAX_NOTES_VALUE = "4";
const FIRST_ROOT_INDEX = 0;
const SECOND_ROOT_INDEX = 1;
const THIRD_ROOT_INDEX = 2;

function mockChordDisplayModePreference(
	chordDisplayMode: "letters" | "german" | "roman" | "sargam" | "solfege",
): void {
	let chordScaleDegreeDisplay: "roman" | "sargam" | "solfege" = "roman";
	if (chordDisplayMode === "solfege") {
		chordScaleDegreeDisplay = "solfege";
	} else if (chordDisplayMode === "sargam") {
		chordScaleDegreeDisplay = "sargam";
	}

	vi.mocked(useChordDisplayModePreference).mockReturnValue({
		chordDisplayCategory:
			chordDisplayMode === "letters" || chordDisplayMode === "german" ? "letters" : "scale_degree",
		chordLetterDisplay: chordDisplayMode === "german" ? "german" : "standard",
		chordDisplayMode,
		chordScaleDegreeDisplay,
	});
}

function getButtonAtIndex(buttons: readonly HTMLElement[], index: number): HTMLElement {
	const button = buttons[index];
	if (button === undefined) {
		throw new Error(`Expected button at index ${index}`);
	}

	return button;
}

vi.mock("@/react/chord-display-mode/ChordDisplayModeSelect");
vi.mock("@/react/chord-display-mode/useChordDisplayModePreference");

function renderChordPicker({
	songKey = "C",
	setSongKey = vi.fn(),
	hasPendingInsertTarget = true,
	initialChordToken,
	isEditingChord = false,
	closeChordPicker = vi.fn(),
	insertChordFromPicker = vi.fn(),
}: Readonly<{
	songKey?: SongKey | "";
	setSongKey?: (value: SongKey | "") => void;
	hasPendingInsertTarget?: boolean;
	initialChordToken?: string;
	isEditingChord?: boolean;
	closeChordPicker?: () => void;
	insertChordFromPicker?: (token: string) => void;
}> = {}): void {
	render(
		<ChordPicker
			songKey={songKey}
			setSongKey={setSongKey}
			hasPendingInsertTarget={hasPendingInsertTarget}
			initialChordToken={initialChordToken}
			isEditingChord={isEditingChord}
			closeChordPicker={closeChordPicker}
			insertChordFromPicker={insertChordFromPicker}
		/>,
	);
}

describe("chordPicker", () => {
	it("shows the chord display mode selector at the top", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker();

		expect(screen.getByTestId("chord-display-mode-select")).toBeTruthy();
	});

	it("shows root buttons in the active chord display mode", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("solfege");

		renderChordPicker();

		fireEvent.click(screen.getByTestId("chord-root-select"));

		expect(screen.getByRole("button", { name: "Do" })).toBeTruthy();
	});

	it("starts at the song key in letters mode", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({ songKey: "G" });

		expect(screen.getByTestId("chord-root-select").textContent).toContain("G");
	});

	it("starts at I in roman mode when the song has a key", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker({ songKey: "G" });

		expect(screen.getByTestId("chord-root-select").textContent).toContain("I");
	});

	it("formats roman-selected roots as letters when the display mode changes", () => {
		const selectedRoot: SelectedRoot = {
			root: "V",
			rootType: "roman",
			label: "V",
		};

		expect(
			formatSelectedRootLabel({
				selectedRoot,
				chordDisplayMode: "letters",
				songKey: "G",
			}),
		).toBe("D");
	});

	it("shows the letter-form preview alongside roman display", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker({ songKey: "G" });

		expect(screen.getByTestId("chord-alternate-form-preview").textContent).toBe("[G M] G B D");
	});

	it("shows the scale-degree preview alongside letter display", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({ songKey: "G" });

		expect(screen.getByText("Scale Degree Form")).toBeTruthy();
		expect(screen.getByTestId("chord-alternate-form-preview").textContent).toBe("[I M]");
	});

	it("does not show scale degree form when no key is selected", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({
			songKey: "",
			initialChordToken: "[A M]",
			isEditingChord: true,
		});

		expect(screen.queryByText("Scale Degree Form")).toBeNull();
		expect(screen.getByTestId("chord-alternate-form-preview").textContent).toBe("—");
	});

	it("preloads the existing chord when editing", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({
			songKey: "C",
			initialChordToken: "[bVII -]",
			isEditingChord: true,
		});

		expect(screen.getByRole("heading", { name: "Edit Chord" })).toBeTruthy();
		expect(screen.getByTestId("chord-root-select").textContent).toContain("B♭");
		expect(screen.getAllByText(/\[B♭ -\]/)).toBeTruthy();
		expect(screen.getByTestId("confirm-insert-chord").textContent).toBe("Update");
	});

	it("shows unicode accidentals in roman preview tokens", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker({
			songKey: "C",
			initialChordToken: "[bIII ROng]",
			isEditingChord: true,
		});

		expect(screen.getByText(/\[♭III ROng\]/)).toBeTruthy();
	});

	it("shows roman options with I first", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker({ songKey: "G" });

		fireEvent.click(screen.getByTestId("chord-root-select"));
		const rootRows = within(screen.getByTestId("chord-root-options")).getAllByRole("button");

		expect(rootRows[FIRST_ROOT_INDEX]?.textContent).toBe("I");
	});

	it("keeps I as the first roman option even when another degree is selected", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker({ songKey: "G" });

		fireEvent.click(screen.getByTestId("chord-root-select"));
		fireEvent.click(screen.getByRole("button", { name: "V" }));
		fireEvent.click(screen.getByTestId("chord-root-select"));

		const rootRows = within(screen.getByTestId("chord-root-options")).getAllByRole("button");

		expect(rootRows[FIRST_ROOT_INDEX]?.textContent).toBe("I");
	});

	it("shows both enharmonic roman root choices", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker();

		fireEvent.click(screen.getByTestId("chord-root-select"));
		const rootOptions = screen.getByTestId("chord-root-options");

		expect(rootOptions.textContent).toContain("♯I");
		expect(rootOptions.textContent).toContain("♭II");
		expect(rootOptions.textContent).toContain("♭V");
		expect(rootOptions.textContent).toContain("♯IV");
	});

	it("groups enharmonic root choices into shared rows", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker();

		fireEvent.click(screen.getByTestId("chord-root-select"));

		const rootRows = within(screen.getByTestId("chord-root-options")).getAllByRole("button");

		expect(rootRows[SECOND_ROOT_INDEX]?.textContent).toBe("♯I");
		expect(rootRows[THIRD_ROOT_INDEX]?.textContent).toBe("♭II");
	});

	it("shows letter root labels when the song has no key", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("roman");

		renderChordPicker({ songKey: "" });

		expect(screen.getByTestId("chord-root-select").textContent).toContain("C");
	});

	it("searches chord shapes by interval spelling and inserts the selected token", () => {
		const insertChordFromPicker = vi.fn();
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({ insertChordFromPicker });

		fireEvent.change(screen.getByTestId("chord-shape-search"), {
			target: { value: "b3" },
		});

		expect(screen.getByText("Minor Chord")).toBeTruthy();
		expect(screen.getAllByText(/♭3/).length).toBeGreaterThan(MIN_INTERVAL_MATCH_COUNT);

		fireEvent.click(screen.getByTestId("chord-root-select"));
		fireEvent.click(screen.getByRole("button", { name: "B♭" }));
		fireEvent.click(screen.getByText("Minor Chord"));
		fireEvent.click(screen.getByTestId("confirm-insert-chord"));

		expect(insertChordFromPicker).toHaveBeenCalledWith("[bVII -]");
	});

	it("shows the chord symbol on search result cards", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker();

		fireEvent.change(screen.getByTestId("chord-shape-search"), {
			target: { value: "perfect seventh" },
		});

		expect(screen.getByText(/Perfect Seventh/)).toBeTruthy();
		expect(screen.getAllByText(/P7/)).toBeTruthy();
	});

	it("moves the selected chord shape to the top of the search results", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker();

		fireEvent.change(screen.getByTestId("chord-shape-search"), {
			target: { value: "7" },
		});

		const results = within(screen.getByTestId("chord-shape-results"));
		const beforeButtons = results.getAllByRole("button");
		const selectedButton = getButtonAtIndex(beforeButtons, SECOND_ROOT_INDEX);
		const selectedText = selectedButton.textContent;
		fireEvent.click(selectedButton);

		const afterButtons = results.getAllByRole("button");
		const [firstAfterButton] = afterButtons;

		expect(firstAfterButton?.textContent).toBe(selectedText);
	});

	it("defaults the max-notes filter to four", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker();

		const maxNotesInput = document.querySelector<HTMLSelectElement>(
			'[data-testid="chord-max-notes"]',
		);

		expect(maxNotesInput?.value).toBe(DEFAULT_MAX_NOTES_VALUE);
	});

	it("updates the song key from the pulldown", () => {
		const setSongKey = vi.fn();
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({ songKey: "", setSongKey });

		fireEvent.click(screen.getByRole("button", { name: "Song Key" }));
		fireEvent.click(screen.getByRole("button", { name: "D♭" }));

		expect(setSongKey).toHaveBeenCalledWith("Db");
	});

	it("closes the picker when escape is pressed", () => {
		const closeChordPicker = vi.fn();
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(
			<div data-testid="chord-display-mode-select" />,
		);
		mockChordDisplayModePreference("letters");

		renderChordPicker({ closeChordPicker });

		fireEvent.keyDown(document, { key: "Escape" });

		expect(closeChordPicker).toHaveBeenCalledTimes(ONE_CALL);
	});
});
