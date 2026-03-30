import { describe, expect, it } from "vitest";

import getDuplicateGroupMap from "./getDuplicateGroupMap";

const FIRST_GROUP_INDEX = 0;
const SECOND_GROUP_INDEX = 1;

describe("getDuplicateGroupMap", () => {
	it("returns duplicate slide ids in first-seen group order", () => {
		expect(
			getDuplicateGroupMap(["slide-1", "slide-2", "slide-1", "slide-3", "slide-2"]),
		).toStrictEqual(
			new Map<string, number>([
				["slide-1", FIRST_GROUP_INDEX],
				["slide-2", SECOND_GROUP_INDEX],
			]),
		);
	});

	it("omits slide ids that only appear once", () => {
		expect(getDuplicateGroupMap(["slide-1", "slide-2", "slide-3"])).toStrictEqual(
			new Map<string, number>(),
		);
	});
});
