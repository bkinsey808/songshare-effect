import { describe, expect, it } from "vitest";

import getFieldLabel from "./getFieldLabel";

describe("getFieldLabel", () => {
	it.each([
		{ field: "lyrics", label: "Lyrics" },
		{ field: "script", label: "Script" },
	])("returns $label for $field", ({ field, label }) => {
		expect(getFieldLabel(field)).toBe(label);
	});

	it("returns an English display name for language codes", () => {
		expect(getFieldLabel("es")).toBe("Spanish");
	});

	it("falls back to the input when Intl.DisplayNames cannot resolve the field", () => {
		expect(getFieldLabel("not-a-language-code")).toBe("not-a-language-code");
	});
});
