import { describe, expect, it } from "vitest";

import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";
import formatSelectedRootLabel from "@/react/music/root-picker/formatSelectedRootLabel";

describe("formatSelectedRootLabel", () => {
	it("formats roman roots as roman labels in roman mode without a song key", () => {
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
			songKey: "",
		});

		// Assert
		expect(result).toBe("♭III");
	});

	it("formats roman roots with letter suffix in roman mode when song key is set", () => {
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
		expect(result).toBe("♭III (E♭)");
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
