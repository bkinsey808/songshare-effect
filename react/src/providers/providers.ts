import { Schema } from "effect";
import type { Either } from "effect/Either";
import type { ParseError } from "effect/ParseResult";

import { AmazonIcon } from "./AmazonIcon";
import { GoogleIcon } from "./GoogleIcon";
import { MicrosoftIcon } from "./MicrosoftIcon";
import { superSafeGet } from "@/shared/utils/safe";

export const Provider = {
	google: "google",
	microsoft: "microsoft",
	amazon: "amazon",
} as const;

type ProviderType = (typeof Provider)[keyof typeof Provider];
export const providers: ProviderType[] = Object.values(Provider);

const ProviderSchema: Schema.Schema<ProviderType> = Schema.Union(
	...providers.map((provider) => Schema.Literal(provider)),
);

/** these are the providers sign in currently works with */
export const activeProviders: ProviderType[] = [
	Provider.google,
	Provider.microsoft,
];

type ProviderData = {
	accessTokenUrl: string;
	clientIdEnvVar: string;
	clientSecretEnvVar: string;
	userInfoUrl: string;
	authBaseUrl: string;
	// main bg color
	brandColor: string;
	// text color
	textColor: string;
	// hover bg color
	hoverColor: string;
	// optional border color
	borderColor: string;
	// optional icon bg color
	iconBgColor: string;
	Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const providerData: Record<ProviderType, ProviderData> = {
	[Provider.google]: {
		accessTokenUrl: "https://oauth2.googleapis.com/token",
		userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
		clientIdEnvVar: "GOOGLE_CLIENT_ID",
		clientSecretEnvVar: "GOOGLE_CLIENT_SECRET",
		authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		// white background
		brandColor: "#fff",
		// Google gray
		textColor: "#3c4043",
		// Google hover
		hoverColor: "#f7f7f7",
		borderColor: "#dadce0",
		iconBgColor: "#fff",
		Icon: GoogleIcon,
	},
	[Provider.microsoft]: {
		accessTokenUrl:
			"https://login.microsoftonline.com/common/oauth2/v2.0/token",
		userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
		clientIdEnvVar: "MS_CLIENT_ID",
		clientSecretEnvVar: "MS_CLIENT_SECRET",
		authBaseUrl:
			"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
		// Microsoft dark
		brandColor: "#2F2F2F",
		textColor: "#fff",
		hoverColor: "#444",
		borderColor: "#444",
		iconBgColor: "#fff",
		Icon: MicrosoftIcon,
	},
	[Provider.amazon]: {
		accessTokenUrl: "https://api.amazon.com/auth/o2/token",
		userInfoUrl: "https://api.amazon.com/user/profile",
		clientIdEnvVar: "AMAZON_CLIENT_ID",
		clientSecretEnvVar: "AMAZON_CLIENT_SECRET",
		authBaseUrl: "https://www.amazon.com/ap/oa",
		// Amazon orange
		brandColor: "#FF9900",
		// Amazon dark blue
		textColor: "#232F3E",
		hoverColor: "#e48f00",
		borderColor: "#e48f00",
		iconBgColor: "#fff",
		Icon: AmazonIcon,
	},
} as const satisfies Record<ProviderType, ProviderData>;

export function getProviderData<T extends ProviderType>(
	provider: T,
): (typeof providerData)[T] {
	return superSafeGet(providerData, provider);
}

export const guardAsProvider = (value: unknown): ProviderType => {
	return Schema.decodeUnknownSync(ProviderSchema)(value);
};

// Alternative functional approach that doesn't throw
export const parseProvider = (
	value: unknown,
): Either<ProviderType, ParseError> => {
	return Schema.decodeUnknownEither(ProviderSchema)(value);
};

export const isProvider = (value: unknown): value is ProviderType => {
	try {
		guardAsProvider(value);
		return true;
	} catch {
		return false;
	}
};
