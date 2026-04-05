import forceCast from "@/react/lib/test-utils/forceCast";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";
import { SlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import type { CurrentUser } from "./CurrentUser.type";

/**
 * Builds a fully populated CurrentUser test object with sensible defaults.
 *
 * @param overrides - Field overrides for the returned test user
 * @returns Mock current user for tests
 */
export default function makeCurrentUser(
	overrides?: Partial<CurrentUser>,
): NonNullable<CurrentUser> {
	return forceCast<NonNullable<CurrentUser>>({
		chordDisplayCategory: ChordDisplayCategory.letters,
		chordLetterDisplay: ChordLetterDisplay.standard,
		chordDisplayMode: "letters",
		chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
		email: "user@example.com",
		name: "Test User",
		role: "user",
		slideNumberPreference: SlideNumberPreference.hide,
		slideOrientationPreference: SlideOrientationPreference.system,
		userId: "user-1",
		username: "tester",
		...overrides,
	});
}
