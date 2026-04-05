import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import useChordDisplayModePreference from "./useChordDisplayModePreference";

vi.mock("@/react/auth/current-user/useCurrentUser");

describe("useChordDisplayModePreference", () => {
	it("derives the effective mode from scale degree display preferences", () => {
		// Arrange
		vi.mocked(useCurrentUser).mockReturnValue(
			forceCast<ReturnType<typeof useCurrentUser>>({
				chordDisplayCategory: ChordDisplayCategory.scaleDegree,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordDisplayMode: ChordDisplayMode.letters,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.solfege,
			}),
		);

		// Act
		const { result } = renderHook(() => useChordDisplayModePreference());

		// Assert
		expect(result.current.chordDisplayCategory).toBe(ChordDisplayCategory.scaleDegree);
		expect(result.current.chordScaleDegreeDisplay).toBe(ChordScaleDegreeDisplay.solfege);
		expect(result.current.chordDisplayMode).toBe(ChordDisplayMode.solfege);
	});

	it("falls back to the default derived scale degree mode for anonymous users", () => {
		// Arrange
		vi.mocked(useCurrentUser).mockReturnValue(undefined);

		// Act
		const { result } = renderHook(() => useChordDisplayModePreference());

		// Assert
		expect(result.current.chordDisplayCategory).toBe(ChordDisplayCategory.scaleDegree);
		expect(result.current.chordLetterDisplay).toBe(ChordLetterDisplay.standard);
		expect(result.current.chordScaleDegreeDisplay).toBe(ChordScaleDegreeDisplay.roman);
		expect(result.current.chordDisplayMode).toBe(ChordDisplayMode.roman);
	});
});
