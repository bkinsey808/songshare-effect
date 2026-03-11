import { describe, expect, it } from "vitest";

import {
	csrfTokenCookieName,
	oauthCsrfCookieName,
	preferredLanguageCookieName,
} from "./cookies";

describe("cookies", () => {
	it.each([
		["preferredLanguageCookieName", preferredLanguageCookieName, "preferred-language"],
		["oauthCsrfCookieName", oauthCsrfCookieName, "oauth-csrf"],
		["csrfTokenCookieName", csrfTokenCookieName, "csrf-token"],
	] as const)("exports %s", (_name, actual, expected) => {
		expect(actual).toBe(expected);
	});
});
