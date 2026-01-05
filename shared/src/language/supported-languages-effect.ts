import { Schema } from "effect";
import { type Either } from "effect/Either";
import { type ParseError } from "effect/ParseResult";

import {
	SupportedLanguage,
	type SupportedLanguageType,
} from "@/shared/language/supported-languages";

export const SupportedLanguageSchema: Schema.Schema<SupportedLanguageType, SupportedLanguageType> =
	Schema.Union(...Object.values(SupportedLanguage).map((lang) => Schema.Literal(lang)));

// throws if not valid
export function guardAsSupportedLanguage(value: unknown): SupportedLanguageType {
	return Schema.decodeUnknownSync(SupportedLanguageSchema)(value);
}

// Alternative functional approach that doesn't throw
export function parseSupportedLanguage(value: unknown): Either<SupportedLanguageType, ParseError> {
	return Schema.decodeUnknownEither(SupportedLanguageSchema)(value);
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguageType {
	try {
		guardAsSupportedLanguage(value);
		return true;
	} catch {
		return false;
	}
}
