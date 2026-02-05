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

/**
 * Assert and return a supported language value or throw when invalid.
 *
 * @param value - Value to validate
 * @returns The value as `SupportedLanguageType` when valid
 */
export function guardAsSupportedLanguage(value: unknown): SupportedLanguageType {
	return Schema.decodeUnknownSync(SupportedLanguageSchema)(value);
}

// Alternative functional approach that doesn't throw

/**
 * Parse a supported language value without throwing; returns an Either with the parsed value or a ParseError.
 *
 * @param value - Value to parse
 * @returns Either containing the parsed SupportedLanguageType or a ParseError
 */
export function parseSupportedLanguage(value: unknown): Either<SupportedLanguageType, ParseError> {
	return Schema.decodeUnknownEither(SupportedLanguageSchema)(value);
}

/**
 * Runtime check for a supported language value.
 *
 * @param value - Value to test
 * @returns True when the value is a valid `SupportedLanguageType`
 */
export function isSupportedLanguage(value: unknown): value is SupportedLanguageType {
	try {
		guardAsSupportedLanguage(value);
		return true;
	} catch {
		return false;
	}
}
