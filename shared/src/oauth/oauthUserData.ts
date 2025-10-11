import { Schema } from "effect";

export type OauthUserData = {
	readonly sub?: string | undefined;
	readonly id?: string | undefined;
	readonly email: string;
	readonly name?: string | undefined;
};

export const OauthUserDataSchema: Schema.Schema<
	OauthUserData,
	OauthUserData,
	never
> = Schema.Struct({
	sub: Schema.optional(Schema.String),
	id: Schema.optional(Schema.String),
	email: Schema.String,
	name: Schema.optional(Schema.String),
});
