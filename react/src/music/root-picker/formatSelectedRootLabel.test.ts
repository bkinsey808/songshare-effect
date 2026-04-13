import { describe, expect, it } from "vitest";

import formatSelectedRootLabel from "@/react/music/root-picker/formatSelectedRootLabel";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";

describe("formatSelectedRootLabel", () => {
	it.each([
		{
			name: "returns the configured label for any roots",
			selectedRoot: { root: "any", rootType: "any", label: "Any" } satisfies SelectedRoot,
			chordDisplayMode: "letters" as const,
			songKey: "C" as const,
			expected: "Any",
		},
		{
			name: "formats roman roots as roman labels in roman mode without a song key",
			selectedRoot: { root: "bIII", rootType: "roman", label: "bIII" } satisfies SelectedRoot,
			chordDisplayMode: "roman" as const,
			songKey: "" as const,
			expected: "♭III",
		},
		{
			name: "formats roman roots with letter suffix in roman mode when song key is set",
			selectedRoot: { root: "bIII", rootType: "roman", label: "bIII" } satisfies SelectedRoot,
			chordDisplayMode: "roman" as const,
			songKey: "C" as const,
			expected: "♭III (E♭)",
		},
		{
			name: "formats roman roots as absolute notes in letter mode",
			selectedRoot: { root: "V", rootType: "roman", label: "V" } satisfies SelectedRoot,
			chordDisplayMode: "letters" as const,
			songKey: "G" as const,
			expected: "D",
		},
	])("$name", ({ selectedRoot, chordDisplayMode, songKey, expected }) => {
		expect(formatSelectedRootLabel({ selectedRoot, chordDisplayMode, songKey })).toBe(expected);
	});
});
