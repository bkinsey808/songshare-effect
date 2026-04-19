import { describe, expect, it } from "vitest";

import buildSegmentKey from "./buildSegmentKey";

const START_POSITION = 0;
const NEXT_POSITION = 5;
const LONG_ANNOTATION = "0123456789tail";
const PLAIN_KEY = "0-plain";
const SLICED_ANNOTATION_KEY = "5-tail";

const cases = [
	{
		name: "uses a plain suffix when no annotation is present",
		position: START_POSITION,
		annotation: undefined,
		expected: PLAIN_KEY,
	},
	{
		name: "uses the configured annotation slice when an annotation is present",
		position: NEXT_POSITION,
		annotation: LONG_ANNOTATION,
		expected: SLICED_ANNOTATION_KEY,
	},
] as const;

describe("buildSegmentKey", () => {
	it.each(cases)("$name", ({ position, annotation, expected }) => {
		// Act
		const result = buildSegmentKey(position, annotation);

		// Assert
		expect(result).toBe(expected);
	});
});
