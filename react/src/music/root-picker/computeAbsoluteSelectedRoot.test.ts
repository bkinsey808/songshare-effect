import { describe, expect, it } from "vitest";

import type { SelectedRoot } from "@/react/music/root-picker/SelectedRoot.type";
import computeAbsoluteSelectedRoot from "@/react/music/root-picker/computeAbsoluteSelectedRoot";

const SONG_KEY_C = "C" as const;
const SONG_KEY_G = "G" as const;
const EMPTY_SONG_KEY = "" as const;

const ABSOLUTE_ROOT_C: SelectedRoot = {
	root: "C",
	rootType: "absolute",
	label: "C",
};

const ROMAN_ROOT_I: SelectedRoot = {
	root: "I",
	rootType: "roman",
	label: "I",
};

const ROMAN_ROOT_V: SelectedRoot = {
	root: "V",
	rootType: "roman",
	label: "V",
};

describe("computeAbsoluteSelectedRoot", () => {
	it("returns the root directly for an absolute-type root regardless of songKey", () => {
		// Act
		const result = computeAbsoluteSelectedRoot(ABSOLUTE_ROOT_C, EMPTY_SONG_KEY);

		// Assert
		expect(result).toBe("C");
	});

	it("resolves roman degree I to the tonic key G when songKey is G", () => {
		// Act
		const result = computeAbsoluteSelectedRoot(ROMAN_ROOT_I, SONG_KEY_G);

		// Assert
		expect(result).toBe("G");
	});

	it("resolves roman degree V to G when songKey is C", () => {
		// Act
		const result = computeAbsoluteSelectedRoot(ROMAN_ROOT_V, SONG_KEY_C);

		// Assert
		expect(result).toBe("G");
	});

	it("returns undefined when songKey is empty and root is roman", () => {
		// Act
		const result = computeAbsoluteSelectedRoot(ROMAN_ROOT_I, EMPTY_SONG_KEY);

		// Assert
		expect(result).toBeUndefined();
	});
});
