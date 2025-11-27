import { Schema } from "effect";

import { OauthStateSchema } from "@/shared/oauth/oauthState";
import { OauthUserDataSchema } from "@/shared/oauth/oauthUserData";

export type RegisterData = {
	readonly oauthUserData: Schema.Schema.Type<typeof OauthUserDataSchema>;
	readonly oauthState: Schema.Schema.Type<typeof OauthStateSchema>;
};

// Constructor-style API from the effect Schema library uses PascalCase.
// This violates `new-cap` in some lint configs; the pattern is intentional and
// clear in context so disable the rule for this expression.
// eslint-disable-next-line new-cap
export const RegisterDataSchema: Schema.Schema<RegisterData> = Schema.Struct({
	oauthUserData: OauthUserDataSchema,
	oauthState: OauthStateSchema,
});

export { RegisterData as type };
