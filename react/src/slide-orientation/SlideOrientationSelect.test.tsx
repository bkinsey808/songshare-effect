import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import { SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import SlideOrientationSelect from "./SlideOrientationSelect";
import useSetSlideOrientationPreference from "./useSetSlideOrientationPreference";
import useSlideOrientationPreference from "./useSlideOrientationPreference";

vi.mock("@/react/auth/current-user/useCurrentUser");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("./useSetSlideOrientationPreference");
vi.mock("./useSlideOrientationPreference");

/**
 * Simple translator used in tests that returns the default text when provided
 * or echoes the key otherwise.
 *
 * @param key - translation key
 * @param defaultVal - optional default translation
 * @returns resolved string for tests
 */
function translateOrDefault(key: string, defaultVal?: string | Record<string, unknown>): string {
	return typeof defaultVal === "string" ? defaultVal : key;
}

describe("slide orientation select", () => {
	it("renders nothing when there is no signed-in user", () => {
		vi.mocked(useCurrentUser).mockReturnValue(undefined);
		vi.mocked(useSlideOrientationPreference).mockReturnValue({
			effectiveSlideOrientation: SlideOrientationPreference.portrait,
			isSystemSlideOrientation: false,
			slideOrientationPreference: SlideOrientationPreference.portrait,
		});
		vi.mocked(useSetSlideOrientationPreference).mockReturnValue(vi.fn());
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "en",
				t: translateOrDefault,
			}),
		);

		const { queryByTestId } = render(<SlideOrientationSelect />);

		expect(queryByTestId("slide-orientation-select")).toBeNull();
	});

	it("updates the global slide orientation preference when changed", () => {
		const setSlideOrientationPreference = vi.fn().mockResolvedValue(undefined);
		vi.mocked(useCurrentUser).mockReturnValue(
			forceCast<ReturnType<typeof useCurrentUser>>({
				email: "user@example.com",
				name: "Test User",
				role: "user",
				slideOrientationPreference: SlideOrientationPreference.system,
				userId: "user-1",
				username: "tester",
			}),
		);
		vi.mocked(useSlideOrientationPreference).mockReturnValue({
			effectiveSlideOrientation: SlideOrientationPreference.portrait,
			isSystemSlideOrientation: true,
			slideOrientationPreference: SlideOrientationPreference.system,
		});
		vi.mocked(useSetSlideOrientationPreference).mockReturnValue(setSlideOrientationPreference);
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({
				lang: "en",
				t: translateOrDefault,
			}),
		);

		const { getByTestId } = render(<SlideOrientationSelect />);

		fireEvent.change(getByTestId("slide-orientation-select"), {
			target: { value: SlideOrientationPreference.landscape },
		});

		expect(setSlideOrientationPreference).toHaveBeenCalledWith(
			SlideOrientationPreference.landscape,
		);
	});
});
