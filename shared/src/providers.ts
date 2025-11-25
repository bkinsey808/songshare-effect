import type { Either } from "effect/Either";
import type { ParseError } from "effect/ParseResult";

import { Schema } from "effect";

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

/** these are the providers sign in currently works with */
export const activeProviders: ProviderType[] = [
	Provider.google,
	Provider.microsoft,
];

export const guardAsProvider = (value: unknown): ProviderType => {
	return Schema.decodeUnknownSync(ProviderSchema)(value);
};

// Alternative functional approach that doesn't throw
export const parseProvider = (
	value: unknown,
): Either<ProviderType, ParseError> => {
	return Schema.decodeUnknownEither(ProviderSchema)(value);
};

export const isProvider = (value: unknown): value is ProviderType => {
	try {
		guardAsProvider(value);
		return true;
	} catch {
		return false;
	}
};
