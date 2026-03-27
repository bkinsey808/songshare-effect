import { describe, expect, it } from "vitest";

import { csrfTokenCookieName, oauthCsrfCookieName, preferredLanguageCookieName } from "./cookies";

describe("cookies", () => {
	const cookieCases = [
		{
			name: "preferredLanguageCookieName",
			actual: preferredLanguageCookieName,
			expected: "preferred-language",
		},
		{ name: "oauthCsrfCookieName", actual: oauthCsrfCookieName, expected: "oauth-csrf" },
		{ name: "csrfTokenCookieName", actual: csrfTokenCookieName, expected: "csrf-token" },
	];

	it.each(cookieCases)("exports $name as expected", ({ actual, expected }) => {
		// Assert
		expect(actual).toBe(expected);
	});
});
