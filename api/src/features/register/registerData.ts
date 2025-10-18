import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

export type RegisterData = {
	readonly oauthUserData: OauthUserData;
	readonly oauthState: OauthState;
};

export { RegisterData as type };
