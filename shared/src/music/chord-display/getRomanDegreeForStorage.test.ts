import { describe, expect, it } from "vitest";

import getRomanDegreeForStorage from "./getRomanDegreeForStorage";

describe("getRomanDegreeForStorage", () => {
	it("returns a roman degree when the song key is available", () => {
		// Act
		const result = getRomanDegreeForStorage("G", "C");

		// Assert
		expect(result).toBe("V");
	});

	it("returns undefined without a song key", () => {
		// Act
		const result = getRomanDegreeForStorage("G", "");

		// Assert
		expect(result).toBeUndefined();
	});
});
