import { describe, expect, it } from "vitest";

import formatRootOptionLabel from "@/react/music/root-picker/formatRootOptionLabel";

describe("formatRootOptionLabel", () => {
	it("formats roman accidentals with unicode symbols", () => {
		// Arrange
		const label = "#I bII";

		// Act
		const result = formatRootOptionLabel(label);

		// Assert
		expect(result).toBe("♯I ♭II");
	});

	it("formats letter accidentals with unicode symbols", () => {
		// Arrange
		const label = "C# Db";

		// Act
		const result = formatRootOptionLabel(label);

		// Assert
		expect(result).toBe("C♯ D♭");
	});
});
