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
		["displayedKey", displayedKey, "alertDisplayed"],
		["typeKey", typeKey, "alertType"],
		["justDeletedAccountKey", justDeletedAccountKey, "justDeletedAccount"],
		["justSignedOutKey", justSignedOutKey, "justSignedOut"],
		["justRegisteredKey", justRegisteredKey, "justRegistered"],
		["justUnauthorizedAccessKey", justUnauthorizedAccessKey, "justUnauthorizedAccess"],
	] as const)("exports %s as %s", (_name, actual, expected) => {
		expect(actual).toBe(expected);
	});
});
