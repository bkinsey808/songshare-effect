/**
 * validate-types exports only TypeScript types (ValidationError, ValidationResult).
 * This test ensures the module loads without error.
 */
import { describe, expect, it } from "vitest";

describe("validate types", () => {
	it("module loads without error", async () => {
		// Act
		const modPromise = import("./validate-types");

		// Assert
		await expect(modPromise).resolves.toBeDefined();
	});
});
