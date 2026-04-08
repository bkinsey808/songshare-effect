import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { ChordShape } from "@/shared/music/chord-shapes";

import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";
import computeCanonicalRootAndShape from "@/react/music/sci/computeCanonicalRootAndShape";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

const SELECTED_ROOT_C: SelectedRoot = {
	root: "C",
	rootType: "absolute",
	label: "C",
};
const BASS_NOTE_E = "E" as const;
const EXPECTED_ROOT_E: SelectedRoot = {
	root: "E",
	rootType: "absolute",
	label: "E",
};

describe("computeCanonicalRootAndShape", () => {
	it("uses the bass note as the root and matchedShape code when the inversion has a matched shape", () => {
		// Arrange
		const matchedShape = forceCast<ChordShape>({ code: "-" });
		const activeInversion = forceCast<SciInversion>({ matchedShape });
		const selectedShape = forceCast<ChordShape>({ code: "M" });

		// Act
		const result = computeCanonicalRootAndShape({
			selectedRoot: SELECTED_ROOT_C,
			selectedShape,
			selectedBassNote: BASS_NOTE_E,
			activeInversion,
		});

		// Assert
		expect(result.root).toStrictEqual(EXPECTED_ROOT_E);
		expect(result.shapeCode).toBe("-");
	});

	it("uses slash notation when the inversion has no matched shape but a bass note and shape are present", () => {
		// Arrange
		const activeInversion = forceCast<SciInversion>({
			matchedShape: undefined,
			reRootedSpelling: "b3,b6",
		});
		const selectedShape = forceCast<ChordShape>({ code: "M" });

		// Act
		const result = computeCanonicalRootAndShape({
			selectedRoot: SELECTED_ROOT_C,
			selectedShape,
			selectedBassNote: BASS_NOTE_E,
			activeInversion,
		});

		// Assert
		expect(result.root).toStrictEqual(SELECTED_ROOT_C);
		expect(result.shapeCode).toBe("M/E");
	});

	it("returns selectedRoot and shape code when there is no inversion and no bass note", () => {
		// Arrange
		const selectedShape = forceCast<ChordShape>({ code: "M" });

		// Act
		const result = computeCanonicalRootAndShape({
			selectedRoot: SELECTED_ROOT_C,
			selectedShape,
			selectedBassNote: undefined,
			activeInversion: undefined,
		});

		// Assert
		expect(result.root).toStrictEqual(SELECTED_ROOT_C);
		expect(result.shapeCode).toBe("M");
	});

	it("returns selectedRoot and undefined shapeCode when there is no shape and no bass note", () => {
		// Act
		const result = computeCanonicalRootAndShape({
			selectedRoot: SELECTED_ROOT_C,
			selectedShape: undefined,
			selectedBassNote: undefined,
			activeInversion: undefined,
		});

		// Assert
		expect(result.root).toStrictEqual(SELECTED_ROOT_C);
		expect(result.shapeCode).toBeUndefined();
	});
});
