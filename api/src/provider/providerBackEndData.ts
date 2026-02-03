import { Provider, type ProviderType } from "@/shared/providers";

/**
 * Backend configuration used for server-side OAuth flows for a provider.
 *
 * - `accessTokenUrl` - Endpoint used to exchange an authorization code for an access token.
 * - `userInfoUrl` - OIDC userinfo endpoint used to fetch user profile data.
 * - `clientIdEnvVar` / `clientSecretEnvVar` - Names of environment variables
 *   that store the provider client credentials on the server.
 * - `authBaseUrl` - Base URL for the provider's authorization endpoint (used when
 *   building authorization redirects).
 */
export type ProviderBackEndData = {
	accessTokenUrl: string;
	clientIdEnvVar: string;
	clientSecretEnvVar: string;
	userInfoUrl: string;
	authBaseUrl: string;
};

/**
 * Mapping from `Provider` to its backend configuration used by server-side
 * OAuth/token flows and user info lookups.
 */
export const providerBackEndData: Record<ProviderType, ProviderBackEndData> = {
	[Provider.google]: {
		accessTokenUrl: "https://oauth2.googleapis.com/token",
		userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
		clientIdEnvVar: "GOOGLE_CLIENT_ID",
		clientSecretEnvVar: "GOOGLE_CLIENT_SECRET",
		authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
	},
	[Provider.microsoft]: {
		accessTokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
		userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
		clientIdEnvVar: "MS_CLIENT_ID",
		clientSecretEnvVar: "MS_CLIENT_SECRET",
		authBaseUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
	},
	[Provider.amazon]: {
		accessTokenUrl: "https://api.amazon.com/auth/o2/token",
		userInfoUrl: "https://api.amazon.com/user/profile",
		clientIdEnvVar: "AMAZON_CLIENT_ID",
		clientSecretEnvVar: "AMAZON_CLIENT_SECRET",
		authBaseUrl: "https://www.amazon.com/ap/oa",
	},
};
