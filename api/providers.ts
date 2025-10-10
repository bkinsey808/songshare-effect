import {
	Provider,
	type ProviderType,
	guardAsProvider,
} from "@/shared/providers";

type ProviderBackEndData = {
	accessTokenUrl: string;
	clientIdEnvVar: string;
	clientSecretEnvVar: string;
	userInfoUrl: string;
	authBaseUrl: string;
};

const ProviderBackEndData: Record<ProviderType, ProviderBackEndData> = {
	[Provider.google]: {
		accessTokenUrl: "https://oauth2.googleapis.com/token",
		userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
		clientIdEnvVar: "GOOGLE_CLIENT_ID",
		clientSecretEnvVar: "GOOGLE_CLIENT_SECRET",
		authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
	},
	[Provider.microsoft]: {
		accessTokenUrl:
			"https://login.microsoftonline.com/common/oauth2/v2.0/token",
		userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
		clientIdEnvVar: "MS_CLIENT_ID",
		clientSecretEnvVar: "MS_CLIENT_SECRET",
		authBaseUrl:
			"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
	},
	[Provider.amazon]: {
		accessTokenUrl: "https://api.amazon.com/auth/o2/token",
		userInfoUrl: "https://api.amazon.com/user/profile",
		clientIdEnvVar: "AMAZON_CLIENT_ID",
		clientSecretEnvVar: "AMAZON_CLIENT_SECRET",
		authBaseUrl: "https://www.amazon.com/ap/oa",
	},
};

export const isProvider = (value: unknown): value is ProviderType => {
	try {
		guardAsProvider(value);
		return true;
	} catch {
		return false;
	}
};
