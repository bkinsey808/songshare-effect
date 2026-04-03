import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChordDisplayModeSelect from "@/react/chord-display-mode/ChordDisplayModeSelect";
import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";

import ChordPickerPage from "./ChordPickerPage";

const ONE_CALL = 1;
const DEFAULT_MAX_NOTES_VALUE = "4";
const FIRST_ROOT_INDEX = 0;
const SECOND_ROOT_INDEX = 1;
const THIRD_ROOT_INDEX = 2;

vi.mock("@/react/chord-display-mode/ChordDisplayModeSelect");
vi.mock("@/react/chord-display-mode/useChordDisplayModePreference");

function renderChordPickerPage({
	songKey = "C",
	hasPendingInsertTarget = true,
	initialChordToken,
	isEditingChord = false,
	closeChordPicker = vi.fn(),
	insertChordFromPicker = vi.fn(),
}: Readonly<{
	songKey?: "C" | "G" | "";
	hasPendingInsertTarget?: boolean;
	initialChordToken?: string;
	isEditingChord?: boolean;
	closeChordPicker?: () => void;
	insertChordFromPicker?: (token: string) => void;
}> = {}): void {
	render(
		<ChordPickerPage
			songKey={songKey}
			hasPendingInsertTarget={hasPendingInsertTarget}
			{...(initialChordToken === undefined ? {} : { initialChordToken })}
			{...(isEditingChord ? { isEditingChord } : {})}
			closeChordPicker={closeChordPicker}
			insertChordFromPicker={insertChordFromPicker}
		/>,
	);
}

describe("chordPickerPage", () => {
	it("shows the chord display mode selector at the top", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "letters" });

		renderChordPickerPage();

		expect(screen.getByTestId("chord-display-mode-select")).toBeTruthy();
	});

	it("shows root buttons in the active chord display mode", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "solfege" });

		renderChordPickerPage();

		fireEvent.click(screen.getByTestId("chord-root-select"));

		expect(screen.getByRole("button", { name: "Do" })).toBeTruthy();
	});

	it("starts at the song key in letters mode", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "letters" });

		renderChordPickerPage({ songKey: "G" });

		expect(screen.getByTestId("chord-root-select").textContent).toContain("G");
	});

	it("starts at I in roman mode when the song has a key", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "roman" });

		renderChordPickerPage({ songKey: "G" });

		expect(screen.getByTestId("chord-root-select").textContent).toContain("I");
	});

	it("preloads the existing chord when editing", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "letters" });

		renderChordPickerPage({
			songKey: "C",
			initialChordToken: "[bVII -]",
			isEditingChord: true,
		});

		expect(screen.getByRole("heading", { name: "Edit Chord" })).toBeTruthy();
		expect(screen.getByTestId("chord-root-select").textContent).toContain("B♭");
		expect(screen.getByTestId("confirm-insert-chord").textContent).toBe("Update");
	});

	it("shows roman options with I first", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "roman" });

		renderChordPickerPage({ songKey: "G" });

		fireEvent.click(screen.getByTestId("chord-root-select"));
		const rootRows = within(screen.getByTestId("chord-root-options")).getAllByRole("button");

		expect(rootRows[FIRST_ROOT_INDEX]?.textContent).toBe("I");
	});

	it("keeps I as the first roman option even when another degree is selected", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "roman" });

		renderChordPickerPage({ songKey: "G" });

		fireEvent.click(screen.getByTestId("chord-root-select"));
		fireEvent.click(screen.getByRole("button", { name: "V" }));
		fireEvent.click(screen.getByTestId("chord-root-select"));

		const rootRows = within(screen.getByTestId("chord-root-options")).getAllByRole("button");

		expect(rootRows[FIRST_ROOT_INDEX]?.textContent).toBe("I");
	});

	it("shows both enharmonic roman root choices", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "roman" });

		renderChordPickerPage();

		fireEvent.click(screen.getByTestId("chord-root-select"));
		const rootOptions = screen.getByTestId("chord-root-options");

		expect(rootOptions.textContent).toContain("#I");
		expect(rootOptions.textContent).toContain("bII");
		expect(rootOptions.textContent).toContain("bV");
		expect(rootOptions.textContent).toContain("#IV");
	});

	it("groups enharmonic root choices into shared rows", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "roman" });

		renderChordPickerPage();

		fireEvent.click(screen.getByTestId("chord-root-select"));

		const rootRows = within(screen.getByTestId("chord-root-options")).getAllByRole("button");

		expect(rootRows[SECOND_ROOT_INDEX]?.textContent).toBe("#I");
		expect(rootRows[THIRD_ROOT_INDEX]?.textContent).toBe("bII");
	});

	it("shows roman numeral root labels even when the song has no key", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "roman" });

		renderChordPickerPage({ songKey: "" });

		expect(screen.getByTestId("chord-root-select").textContent).toContain("I");
	});

	it("searches chord shapes by interval spelling and inserts the selected token", () => {
		const insertChordFromPicker = vi.fn();
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "letters" });

		renderChordPickerPage({ insertChordFromPicker });

		fireEvent.change(screen.getByTestId("chord-shape-search"), {
			target: { value: "b3" },
		});

		expect(screen.getByText("Minor Chord")).toBeTruthy();

		fireEvent.click(screen.getByTestId("chord-root-select"));
		fireEvent.click(screen.getByRole("button", { name: "B♭" }));
		fireEvent.click(screen.getByText("Minor Chord"));
		fireEvent.click(screen.getByTestId("confirm-insert-chord"));

		expect(insertChordFromPicker).toHaveBeenCalledWith("[bVII -]");
	});

	it("defaults the max-notes filter to four", () => {
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "letters" });

		renderChordPickerPage();

		const maxNotesInput = document.querySelector<HTMLSelectElement>(
			'[data-testid="chord-max-notes"]',
		);

		expect(maxNotesInput?.value).toBe(DEFAULT_MAX_NOTES_VALUE);
	});

	it("closes the picker when escape is pressed", () => {
		const closeChordPicker = vi.fn();
		vi.mocked(ChordDisplayModeSelect).mockReturnValue(<div data-testid="chord-display-mode-select" />);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({ chordDisplayMode: "letters" });

		renderChordPickerPage({ closeChordPicker });

		fireEvent.keyDown(document, { key: "Escape" });

		expect(closeChordPicker).toHaveBeenCalledTimes(ONE_CALL);
	});
});
