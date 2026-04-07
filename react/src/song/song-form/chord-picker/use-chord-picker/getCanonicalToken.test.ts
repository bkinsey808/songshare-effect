import { describe, expect, it } from "vitest";

import getCanonicalToken from "./getCanonicalToken";

const C_KEY = "C" as const;
const BB_ROOT = "Bb" as const;
const BIII_ROOT = "bIII" as const;
const C_ROOT = "C" as const;
const MINOR_SHAPE_CODE = "-";
const RONG_SHAPE_CODE = "ROng";
const SYNTHETIC_SHAPE_CODE = "b3,5";

describe("getCanonicalToken", () => {
	it.each([
		{
			name: "absolute root is converted to its roman degree for storage",
			selectedRoot: { root: BB_ROOT, rootType: "absolute" as const, label: "Bb" },
			selectedShapeCode: MINOR_SHAPE_CODE,
			songKey: C_KEY,
			expected: "[bVII -]",
		},
		{
			name: "roman root is preserved as-is in the token",
			selectedRoot: { root: BIII_ROOT, rootType: "roman" as const, label: "bIII" },
			selectedShapeCode: RONG_SHAPE_CODE,
			songKey: C_KEY,
			expected: "[bIII ROng]",
		},
		{
			name: "undefined shape code",
			selectedRoot: { root: C_ROOT, rootType: "absolute" as const, label: "C" },
			selectedShapeCode: undefined,
			songKey: C_KEY,
			expected: undefined,
		},
		{
			name: "synthetic (comma-containing) shape code",
			selectedRoot: { root: C_ROOT, rootType: "absolute" as const, label: "C" },
			selectedShapeCode: SYNTHETIC_SHAPE_CODE,
			songKey: C_KEY,
			expected: undefined,
		},
	])("$name — returns $expected", ({ selectedRoot, selectedShapeCode, songKey, expected }) => {
		// Act
		const result = getCanonicalToken({ selectedRoot, selectedShapeCode, songKey });

		// Assert
		expect(result).toBe(expected);
	});
});
