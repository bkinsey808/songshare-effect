import { Schema } from "effect";

import { type SupportedLanguageType } from "@/shared/language/supported-languages";
import { SupportedLanguageSchema } from "@/shared/language/supported-languages-effect";
import { ProviderSchema, type ProviderType } from "@/shared/providers";

import { type ReadonlyDeep } from "../types/ReadonlyDeep.type";

export type OauthState = {
	readonly csrf: string;
	readonly lang: SupportedLanguageType;
	readonly provider: ProviderType;
	readonly redirect_port?: string | undefined;
	readonly redirect_origin?: string | undefined;
};

export type ReadonlyOauthState = ReadonlyDeep<OauthState>;

export const OauthStateSchema: Schema.Schema<OauthState> = Schema.Struct({
	csrf: Schema.String,
	lang: Schema.suspend(() => SupportedLanguageSchema),
	provider: Schema.suspend(() => ProviderSchema),
	redirect_port: Schema.optional(Schema.String),
	redirect_origin: Schema.optional(Schema.String),
});

/**
 * Parse an encoded OAuth state parameter into a validated `OauthState` object.
 *
 * @param oauthStateParamsString - Encoded OAuth state string (URI and JSON encoded)
 * @returns The decoded and validated `OauthState` object
 * @throws When decoding or schema validation fails
 */
export function parseOauthState(oauthStateParamsString: string): OauthState {
	// Throws if decodeURIComponent or JSON.parse fails (invalid URI or JSON)
	// Also throws if the parsed object fails validation via the effect `Schema` decoder.
	// Caller should handle any thrown errors.
	const parsed = JSON.parse(decodeURIComponent(oauthStateParamsString)) as unknown;

	// Decode the entire object with the schema so TypeScript gets the precise shape
	const decoded = Schema.decodeUnknownSync(OauthStateSchema)(parsed);

	return decoded;
}
