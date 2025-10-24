export type FetchOpts = {
	accessTokenUrl: string;
	redirectUri: string;
	code: string;
	clientId?: string | undefined;
	clientSecret?: string | undefined;
	userInfoUrl: string;
};
