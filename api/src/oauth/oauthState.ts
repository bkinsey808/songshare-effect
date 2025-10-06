// import { type InferOutput, object, optional, parse, string } from "valibot";

// import { langSchema } from "@/features/i18n/supportedLangs";
// import { providerSchema } from "@/features/providers/provider";

// export const oauthStateSchema = object({
// 	csrf: string(),
// 	lang: langSchema,
// 	provider: providerSchema,
// 	redirect_port: optional(string()),
// });

// export type OauthState = InferOutput<typeof oauthStateSchema>;

// export function parseOauthState(oauthStateParamsString: string): OauthState {
// 	// Throws if decodeURIComponent or JSON.parse fails (invalid URI or JSON)
// 	// Also throws if the parsed object does not match oauthStateSchema
// 	// Caller should handle any thrown errors.
// 	return parse(
// 		oauthStateSchema,
// 		JSON.parse(decodeURIComponent(oauthStateParamsString)),
// 	);
// }
