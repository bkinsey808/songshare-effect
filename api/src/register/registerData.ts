import { Schema } from "effect";

import { OauthStateSchema } from "@/shared/oauth/oauthState";
import { OauthUserDataSchema } from "@/shared/oauth/oauthUserData";

export type RegisterData = {
	readonly oauthUserData: Schema.Schema.Type<typeof OauthUserDataSchema>;
	readonly oauthState: Schema.Schema.Type<typeof OauthStateSchema>;
};

export const RegisterDataSchema: Schema.Schema<RegisterData> = Schema.Struct({
	oauthUserData: OauthUserDataSchema,
	oauthState: OauthStateSchema,
});

export { RegisterData as type };
