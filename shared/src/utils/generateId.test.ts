import { describe, expect, it } from "vitest";

import generateId from "./generateId";

const MIN_ID_LENGTH = 1;

describe("generateId", () => {
	it("returns a non-empty string", () => {
		// Arrange & Act
		const id = generateId();

		// Assert
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThanOrEqual(MIN_ID_LENGTH);
	});

	it("generates unique values on subsequent calls", () => {
		// Act
		const idA = generateId();
		const idB = generateId();

		// Assert
		expect(idA).not.toBe(idB);
	});
});
