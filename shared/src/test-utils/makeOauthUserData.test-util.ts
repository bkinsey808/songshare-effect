import type { OauthUserData } from "../oauth/oauthUserData";

/**
 * Build OAuth user data for tests from a small override object.
 *
 * @param overrides - Partial OAuth user data overrides
 * @returns Complete OAuth user data
 */
export default function makeOauthUserData(overrides: Partial<OauthUserData> = {}): OauthUserData {
	return {
		email: "u@example.com",
		name: "Test User",
		sub: "sub-1",
		...overrides,
	};
}
