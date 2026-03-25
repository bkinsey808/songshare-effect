import { describe, expect, it } from "vitest";

import {
	displayedKey,
	justDeletedAccountKey,
	justRegisteredKey,
	justSignedOutKey,
	justUnauthorizedAccessKey,
	typeKey,
} from "./sessionStorageKeys";

describe("sessionStorageKeys", () => {
	it.each([
		[displayedKey, "alertDisplayed"],
		[typeKey, "alertType"],
		[justDeletedAccountKey, "justDeletedAccount"],
		[justSignedOutKey, "justSignedOut"],
		[justRegisteredKey, "justRegistered"],
		[justUnauthorizedAccessKey, "justUnauthorizedAccess"],
	] as const)("exports %s as %s", (actual, expected) => {
		// Assert
		expect(actual).toBe(expected);
	});
});
