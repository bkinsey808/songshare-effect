import type { OauthState } from "../oauth/oauthState";
import { Provider } from "../providers";

/**
 * Build OAuth state for tests from a small override object.
 *
 * @param overrides - Partial OAuth state overrides
 * @returns Complete OAuth state
 */
export default function makeOauthState(overrides: Partial<OauthState> = {}): OauthState {
	return {
		csrf: "x",
		lang: "en",
		provider: Provider.google,
		...overrides,
	};
}
