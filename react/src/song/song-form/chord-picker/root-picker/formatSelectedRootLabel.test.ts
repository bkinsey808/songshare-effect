import { describe, expect, it } from "vitest";

import type { SelectedRoot } from "./chordPickerRootOptionTypes";
import formatSelectedRootLabel from "./formatSelectedRootLabel";

describe("formatSelectedRootLabel", () => {
	it("formats roman roots as roman labels in roman mode", () => {
		// Arrange
		const selectedRoot: SelectedRoot = {
			root: "bIII",
			rootType: "roman",
			label: "bIII",
		};

		// Act
		const result = formatSelectedRootLabel({
			selectedRoot,
			chordDisplayMode: "roman",
			songKey: "C",
		});

		// Assert
		expect(result).toBe("♭III");
	});

	it("formats roman roots as absolute notes in letter mode", () => {
		// Arrange
		const selectedRoot: SelectedRoot = {
			root: "V",
			rootType: "roman",
			label: "V",
		};

		// Act
		const result = formatSelectedRootLabel({
			selectedRoot,
			chordDisplayMode: "letters",
			songKey: "G",
		});

		// Assert
		expect(result).toBe("D");
	});
});
