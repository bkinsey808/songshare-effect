import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import ChordDisplayModeSelect from "./ChordDisplayModeSelect";
import useChordDisplayModePreference from "./useChordDisplayModePreference";
import useSetChordDisplayPreferences from "./useSetChordDisplayPreferences";

vi.mock("@/react/auth/current-user/useCurrentUser");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("./useChordDisplayModePreference");
vi.mock("./useSetChordDisplayPreferences");

function translateOrDefault(key: string, defaultVal?: string | Record<string, unknown>): string {
	return typeof defaultVal === "string" ? defaultVal : key;
}

describe("chord display mode select", () => {
	it("renders nothing when there is no signed-in user", () => {
		vi.mocked(useCurrentUser).mockReturnValue(undefined);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordDisplayMode: ChordDisplayMode.letters,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		});
		vi.mocked(useSetChordDisplayPreferences).mockReturnValue(vi.fn());
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "en",
				t: translateOrDefault,
			}),
		);

		const { queryByTestId } = render(<ChordDisplayModeSelect />);

		expect(queryByTestId("chord-display-category-select")).toBeNull();
	});

	it("updates the split chord display preferences when controls change", () => {
		const setChordDisplayPreferences = vi.fn().mockResolvedValue(undefined);
		vi.mocked(useCurrentUser).mockReturnValue(
			forceCast<ReturnType<typeof useCurrentUser>>({
				chordDisplayCategory: ChordDisplayCategory.letters,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordDisplayMode: ChordDisplayMode.letters,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
				email: "user@example.com",
				name: "Test User",
				role: "user",
				slideNumberPreference: "hide",
				slideOrientationPreference: "system",
				userId: "user-1",
				username: "tester",
			}),
		);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordDisplayMode: ChordDisplayMode.letters,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		});
		vi.mocked(useSetChordDisplayPreferences).mockReturnValue(setChordDisplayPreferences);
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "en",
				t: translateOrDefault,
			}),
		);

		const { getByTestId } = render(<ChordDisplayModeSelect />);

		fireEvent.change(getByTestId("chord-display-category-select"), {
			target: { value: ChordDisplayCategory.scaleDegree },
		});
		fireEvent.change(getByTestId("chord-letter-display-select"), {
			target: { value: ChordLetterDisplay.german },
		});
		fireEvent.change(getByTestId("chord-scale-degree-display-select"), {
			target: { value: ChordScaleDegreeDisplay.sargam },
		});

		expect(setChordDisplayPreferences).toHaveBeenCalledWith({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
		});
		expect(setChordDisplayPreferences).toHaveBeenCalledWith({
			chordLetterDisplay: ChordLetterDisplay.german,
		});
		expect(setChordDisplayPreferences).toHaveBeenCalledWith({
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
		});
	});
});
