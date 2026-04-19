import { describe, expect, it } from "vitest";

import type { AnnotatedSegment } from "./AnnotatedSegment.type";
import buildSegmentKeys from "./buildSegmentKeys";

const EMPTY_SEGMENTS: readonly AnnotatedSegment[] = [];
const FIRST_SEGMENT_TEXT = "Hello";
const SECOND_SEGMENT_TEXT = " world";
const LONG_ANNOTATION = "0123456789tail";
const EXPECTED_KEYS = ["0-plain", "5-tail"];

const cases = [
	{
		name: "returns an empty array when there are no segments",
		segments: EMPTY_SEGMENTS,
		expected: [],
	},
	{
		name: "builds stable keys from cumulative segment offsets",
		segments: [
			{ annotation: undefined, text: FIRST_SEGMENT_TEXT },
			{ annotation: LONG_ANNOTATION, text: SECOND_SEGMENT_TEXT },
		] satisfies readonly AnnotatedSegment[],
		expected: EXPECTED_KEYS,
	},
] as const;

describe("buildSegmentKeys", () => {
	it.each(cases)("$name", ({ segments, expected }) => {
		// Act
		const result = buildSegmentKeys(segments);

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
