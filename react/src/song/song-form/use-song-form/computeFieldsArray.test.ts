import { describe, expect, it } from "vitest";

import computeFieldsArray from "./computeFieldsArray";

describe("computeFieldsArray", () => {
	it("returns empty array for missing or malformed input", () => {
		expect(computeFieldsArray(undefined)).toStrictEqual([]);
		expect(computeFieldsArray({})).toStrictEqual([]);
		expect(computeFieldsArray({ lyrics: 123 })).toStrictEqual([]);
	});

	it("returns language-derived fields in order", () => {
		const pub: Record<string, unknown> = {
			lyrics: "sa",
			script: "sa-Latn",
			translations: ["en", true, "es"],
		};
		expect(computeFieldsArray(pub)).toStrictEqual(["sa", "sa-Latn", "en", "es"]);
	});
});
