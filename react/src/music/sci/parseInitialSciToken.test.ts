import { describe, expect, it } from "vitest";

import parseInitialSciToken from "@/react/music/sci/parseInitialSciToken";

describe("parseInitialSciToken", () => {
	it.each([
		["undefined input", undefined],
		["missing brackets", "A M"],
		["invalid bracketed body", "[not-a-root M]"],
	] as const)("returns undefined when %s", (_label, input) => {
		expect(parseInitialSciToken(input)).toBeUndefined();
	});

	it.each([
		["absolute-root token", "[Bb sus4]", { root: "Bb", rootType: "absolute", shapeCode: "sus4" }],
		["roman-root token", "[bVII d7]", { root: "bVII", rootType: "roman", shapeCode: "d7" }],
	] as const)("parses %s", (_label, input, expected) => {
		expect(parseInitialSciToken(input)).toStrictEqual(expected);
	});
});
