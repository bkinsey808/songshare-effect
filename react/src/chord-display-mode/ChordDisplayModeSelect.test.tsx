import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ChordDisplayMode } from "@/shared/user/chordDisplayMode";

import ChordDisplayModeSelect from "./ChordDisplayModeSelect";
import useChordDisplayModePreference from "./useChordDisplayModePreference";
import useSetChordDisplayMode from "./useSetChordDisplayMode";

vi.mock("@/react/auth/current-user/useCurrentUser");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("./useChordDisplayModePreference");
vi.mock("./useSetChordDisplayMode");

function translateOrDefault(key: string, defaultVal?: string | Record<string, unknown>): string {
	return typeof defaultVal === "string" ? defaultVal : key;
}

describe("chord display mode select", () => {
	it("renders nothing when there is no signed-in user", () => {
		vi.mocked(useCurrentUser).mockReturnValue(undefined);
		vi.mocked(useChordDisplayModePreference).mockReturnValue({
			chordDisplayMode: ChordDisplayMode.letters,
		});
		vi.mocked(useSetChordDisplayMode).mockReturnValue(vi.fn());
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "en",
				t: translateOrDefault,
			}),
		);

		const { queryByTestId } = render(<ChordDisplayModeSelect />);

		expect(queryByTestId("chord-display-mode-select")).toBeNull();
	});

	it("updates the global chord display mode when changed", () => {
		const setChordDisplayMode = vi.fn().mockResolvedValue(undefined);
		vi.mocked(useCurrentUser).mockReturnValue(
			forceCast<ReturnType<typeof useCurrentUser>>({
				chordDisplayMode: ChordDisplayMode.letters,
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
			chordDisplayMode: ChordDisplayMode.letters,
		});
		vi.mocked(useSetChordDisplayMode).mockReturnValue(setChordDisplayMode);
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "en",
				t: translateOrDefault,
			}),
		);

		const { getByTestId } = render(<ChordDisplayModeSelect />);

		fireEvent.change(getByTestId("chord-display-mode-select"), {
			target: { value: ChordDisplayMode.roman },
		});

		expect(setChordDisplayMode).toHaveBeenCalledWith(ChordDisplayMode.roman);
	});
});
