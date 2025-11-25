import type { Either } from "effect/Either";
import type { ParseError } from "effect/ParseResult";

import { Schema } from "effect";

import {
	SupportedLanguage,
	type SupportedLanguageType,
} from "@/shared/language/supported-languages";

export const SupportedLanguageSchema: Schema.Schema<
	SupportedLanguageType,
	SupportedLanguageType
> = Schema.Union(
	...Object.values(SupportedLanguage).map((lang) => Schema.Literal(lang)),
);

// throws if not valid
export const guardAsSupportedLanguage = (
	value: unknown,
): SupportedLanguageType => {
	return Schema.decodeUnknownSync(SupportedLanguageSchema)(value);
};

// Alternative functional approach that doesn't throw
export const parseSupportedLanguage = (
	value: unknown,
): Either<SupportedLanguageType, ParseError> => {
	return Schema.decodeUnknownEither(SupportedLanguageSchema)(value);
};

export const isSupportedLanguage = (
	value: unknown,
): value is SupportedLanguageType => {
	try {
		guardAsSupportedLanguage(value);
		return true;
	} catch {
		return false;
	}
};
