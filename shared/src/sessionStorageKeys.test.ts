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
	const keyCases = [
		{ name: "displayedKey", actual: displayedKey, expected: "alertDisplayed" },
		{ name: "typeKey", actual: typeKey, expected: "alertType" },
		{
			name: "justDeletedAccountKey",
			actual: justDeletedAccountKey,
			expected: "justDeletedAccount",
		},
		{ name: "justSignedOutKey", actual: justSignedOutKey, expected: "justSignedOut" },
		{ name: "justRegisteredKey", actual: justRegisteredKey, expected: "justRegistered" },
		{
			name: "justUnauthorizedAccessKey",
			actual: justUnauthorizedAccessKey,
			expected: "justUnauthorizedAccess",
		},
	];

	it.each(keyCases)("exports $name as expected value", ({ actual, expected }) => {
		// Assert
		expect(actual).toBe(expected);
	});
});
