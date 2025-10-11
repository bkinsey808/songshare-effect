import { Schema } from "effect";

import {
	SupportedLanguageSchema,
	type SupportedLanguageType,
} from "@/shared/language/supportedLanguages";
import { ProviderSchema, type ProviderType } from "@/shared/providers";

export type OauthState = {
	readonly csrf: string;
	readonly lang: SupportedLanguageType;
	readonly provider: ProviderType;
	readonly redirect_port?: string | undefined;
};

export const OauthStateSchema: Schema.Schema<OauthState, OauthState, never> =
	Schema.Struct({
		csrf: Schema.String,
		lang: Schema.suspend(() => SupportedLanguageSchema),
		provider: Schema.suspend(() => ProviderSchema),
		redirect_port: Schema.optional(Schema.String),
	});

export function parseOauthState(oauthStateParamsString: string): OauthState {
	// Throws if decodeURIComponent or JSON.parse fails (invalid URI or JSON)
	// Also throws if the parsed object fails validation via the effect `Schema` decoder.
	// Caller should handle any thrown errors.
	const parsed = JSON.parse(
		decodeURIComponent(oauthStateParamsString),
	) as unknown;

	// Decode the entire object with the schema so TypeScript gets the precise shape
	const decoded = Schema.decodeUnknownSync(OauthStateSchema)(parsed);

	return decoded;
}
