import { describe, expect, it } from "vitest";

import formatRootOptionLabel from "@/react/music/root-picker/formatRootOptionLabel";

describe("formatRootOptionLabel", () => {
	it.each([
		["formats roman accidentals with unicode symbols", "#I bII", "♯I ♭II"],
		["formats letter accidentals with unicode symbols", "C# Db", "C♯ D♭"],
	])("%s", (_name, label, expected) => {
		expect(formatRootOptionLabel(label)).toBe(expected);
	});
});
