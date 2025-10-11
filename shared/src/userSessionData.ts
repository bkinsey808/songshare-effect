import { Schema } from "effect";

import { UserPublicSchema, UserSchema } from "./generated/supabaseSchemas";
import { OauthStateSchema } from "./oauth/oauthState";
import { OauthUserDataSchema } from "./oauth/oauthUserData";

export type UserSessionData = {
	readonly user: Schema.Schema.Type<typeof UserSchema>;
	readonly userPublic: Schema.Schema.Type<typeof UserPublicSchema>;
	readonly oauthUserData: Schema.Schema.Type<typeof OauthUserDataSchema>;
	readonly oauthState: Schema.Schema.Type<typeof OauthStateSchema>;
	readonly ip: string;
};

export const UserSessionDataSchema: Schema.Schema<
	UserSessionData,
	UserSessionData,
	never
> = Schema.Struct({
	user: UserSchema,
	userPublic: UserPublicSchema,
	oauthUserData: OauthUserDataSchema,
	oauthState: OauthStateSchema,
	ip: Schema.String,
});
