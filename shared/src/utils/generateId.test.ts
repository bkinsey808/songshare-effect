import { describe, it, expect } from "vitest";
import generateId from "./generateId";

const MIN_ID_LENGTH = 1;

describe("generateId", () => {
	it("returns a non-empty string", () => {
		const id = generateId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThanOrEqual(MIN_ID_LENGTH);
	});

	it("generates unique values on subsequent calls", () => {
		const idA = generateId();
		const idB = generateId();
		expect(idA).not.toBe(idB);
	});
});
