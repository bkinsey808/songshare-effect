import { Provider } from "../providers";
import type { UserSessionData } from "../userSessionData";
import makeUser from "./makeUser.test-util";
import makeUserPublic from "./makeUserPublic.test-util";

type UserSessionDataOverrides = Partial<Omit<UserSessionData, "user" | "userPublic">> & {
	user?: Partial<UserSessionData["user"]>;
	userPublic?: Partial<UserSessionData["userPublic"]>;
};

/**
 * Build complete user session data for tests from partial nested overrides.
 *
 * @param overrides - Partial nested overrides for the default session data
 * @returns Complete UserSessionData
 */
export default function makeUserSessionData(
	overrides: UserSessionDataOverrides = {},
): UserSessionData {
	const {
		oauthState,
		oauthUserData,
		ip,
		user: _userOverride,
		userPublic: _userPublicOverride,
	} = overrides;
	const user = makeUser(overrides.user);
	const userPublic = makeUserPublic({
		user_id: user.user_id,
		username: user.name.toLowerCase().replaceAll(/\s+/gu, ""),
		...overrides.userPublic,
	});

	return {
		user,
		userPublic,
		oauthUserData: {
			email: user.email,
			name: user.name,
			sub: user.sub,
			...oauthUserData,
		},
		oauthState: {
			csrf: "x",
			lang: "en",
			provider: Provider.google,
			...oauthState,
		},
		ip: ip ?? "127.0.0.1",
	};
}
