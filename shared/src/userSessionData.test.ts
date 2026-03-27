import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { Provider } from "@/shared/providers";

import { UserSessionDataSchema } from "./userSessionData";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const MINIMAL_USER = {
	user_id: VALID_UUID,
	email: "u@example.com",
	linked_providers: [],
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	google_calendar_access: "none",
	name: "User",
	role: "user",
};

const MINIMAL_USER_PUBLIC = {
	user_id: VALID_UUID,
	username: "alice",
};

const MINIMAL_OAUTH_USER_DATA = {
	email: "u@example.com",
};

const MINIMAL_OAUTH_STATE = {
	csrf: "csrf-token",
	lang: "en",
	provider: Provider.google,
};

describe("userSessionData schema", () => {
	const ERROR_RE = /required|decode|parse|invalid|Expected|missing/i;

	type PassCase = { name: string; input: unknown };
	type FailCase = { name: string; input: unknown; error: RegExp };

	const PASS_CASES: readonly PassCase[] = [
		{
			name: "decodes valid UserSessionData",
			input: {
				user: MINIMAL_USER,
				userPublic: MINIMAL_USER_PUBLIC,
				oauthUserData: MINIMAL_OAUTH_USER_DATA,
				oauthState: MINIMAL_OAUTH_STATE,
				ip: "127.0.0.1",
			},
		},
	];

	const FAIL_CASES: readonly FailCase[] = [
		{
			name: "throws when required field is missing",
			input: {
				user: MINIMAL_USER,
				userPublic: MINIMAL_USER_PUBLIC,
				oauthUserData: MINIMAL_OAUTH_USER_DATA,
				oauthState: MINIMAL_OAUTH_STATE,
				// ip missing
			},
			error: ERROR_RE,
		},
		{
			name: "throws when user shape is invalid",
			input: {
				user: { invalid: "shape" },
				userPublic: MINIMAL_USER_PUBLIC,
				oauthUserData: MINIMAL_OAUTH_USER_DATA,
				oauthState: MINIMAL_OAUTH_STATE,
				ip: "127.0.0.1",
			},
			error: ERROR_RE,
		},
	];

	it.each(PASS_CASES)("$name", ({ input }) => {
		// Act
		const result = Schema.decodeUnknownSync(UserSessionDataSchema)(input);

		// Assert
		expect(result).toMatchObject({
			user: MINIMAL_USER,
			userPublic: MINIMAL_USER_PUBLIC,
			oauthUserData: MINIMAL_OAUTH_USER_DATA,
			oauthState: MINIMAL_OAUTH_STATE,
			ip: "127.0.0.1",
		});
	});

	it.each(FAIL_CASES)("$name", ({ input, error }) => {
		// Act
		let thrown: unknown = undefined;
		try {
			Schema.decodeUnknownSync(UserSessionDataSchema)(input);
		} catch (error) {
			thrown = error;
		}

		// Assert
		expect(thrown).toBeDefined();
		expect(String(thrown)).toMatch(error);
	});
});
