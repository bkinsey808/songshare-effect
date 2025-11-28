import { Schema } from "effect";

import { type ReadonlyDeep } from "../types/deep-readonly";

export type OauthUserData = {
	readonly sub?: string | undefined;
	readonly id?: string | undefined;
	readonly email: string;
	readonly name?: string | undefined;
};

export type ReadonlyOauthUserData = ReadonlyDeep<OauthUserData>;

export const OauthUserDataSchema: Schema.Schema<OauthUserData> = Schema.Struct({
	sub: Schema.optional(Schema.String),
	id: Schema.optional(Schema.String),
	email: Schema.String,
	name: Schema.optional(Schema.String),
});
