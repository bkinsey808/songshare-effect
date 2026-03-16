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
	it("decodes valid UserSessionData", () => {
		const input = {
			user: MINIMAL_USER,
			userPublic: MINIMAL_USER_PUBLIC,
			oauthUserData: MINIMAL_OAUTH_USER_DATA,
			oauthState: MINIMAL_OAUTH_STATE,
			ip: "127.0.0.1",
		};

		const result = Schema.decodeUnknownSync(UserSessionDataSchema)(input);

		expect(result).toMatchObject({
			user: MINIMAL_USER,
			userPublic: MINIMAL_USER_PUBLIC,
			oauthUserData: MINIMAL_OAUTH_USER_DATA,
			oauthState: MINIMAL_OAUTH_STATE,
			ip: "127.0.0.1",
		});
	});

	it("throws when required field is missing", () => {
		const invalid = {
			user: MINIMAL_USER,
			userPublic: MINIMAL_USER_PUBLIC,
			oauthUserData: MINIMAL_OAUTH_USER_DATA,
			oauthState: MINIMAL_OAUTH_STATE,
			// ip missing
		};

		expect(() => Schema.decodeUnknownSync(UserSessionDataSchema)(invalid)).toThrow(
			/required|decode|parse|invalid|Expected|missing/i,
		);
	});

	it("throws when user shape is invalid", () => {
		const invalid = {
			user: { invalid: "shape" },
			userPublic: MINIMAL_USER_PUBLIC,
			oauthUserData: MINIMAL_OAUTH_USER_DATA,
			oauthState: MINIMAL_OAUTH_STATE,
			ip: "127.0.0.1",
		};

		expect(() => Schema.decodeUnknownSync(UserSessionDataSchema)(invalid)).toThrow(
			/required|decode|parse|invalid|Expected|missing/i,
		);
	});
});
