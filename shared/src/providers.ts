import { Schema } from "effect";
import { type Either } from "effect/Either";
import { type ParseError } from "effect/ParseResult";

export const Provider = {
	google: "google",
	microsoft: "microsoft",
	amazon: "amazon",
} as const;

export type ProviderType = (typeof Provider)[keyof typeof Provider];
export const providers: ProviderType[] = Object.values(Provider);

export const ProviderSchema: Schema.Schema<ProviderType> = Schema.Union(
	...providers.map((provider) => Schema.Literal(provider)),
);

/**
 * Providers currently enabled for sign-in flows in this application.
 *
 * The list should be updated when support for additional providers is added
 * or during feature flags / configuration changes.
 */
export const activeProviders: ProviderType[] = [Provider.google, Provider.microsoft];

export function guardAsProvider(value: unknown): ProviderType {
	return Schema.decodeUnknownSync(ProviderSchema)(value);
}

// Alternative functional approach that doesn't throw
export function parseProvider(value: unknown): Either<ProviderType, ParseError> {
	return Schema.decodeUnknownEither(ProviderSchema)(value);
}

export function isProvider(value: unknown): value is ProviderType {
	try {
		guardAsProvider(value);
		return true;
	} catch {
		return false;
	}
}
