import { describe, expect, it } from "vitest";

import { NOT_FOUND, ONE, THREE, TWO, ZERO } from "./shared-constants";

describe("shared-constants", () => {
	const constCases = [
		{ name: "ZERO", value: ZERO },
		{ name: "ONE", value: ONE },
		{ name: "TWO", value: TWO },
		{ name: "THREE", value: THREE },
		{ name: "NOT_FOUND", value: NOT_FOUND },
	];

	it.each(constCases)("exports $name as number", ({ value }) => {
		// Assert
		expect(value).toBeDefined();
		expect(typeof value).toBe("number");
	});
});
