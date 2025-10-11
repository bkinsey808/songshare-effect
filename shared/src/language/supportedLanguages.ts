import { Schema } from "effect";
import type { Either } from "effect/Either";
import type { ParseError } from "effect/ParseResult";

export const SupportedLanguage = {
	en: "en",
	es: "es",
	zh: "zh",
} as const;

export const languageNames: Record<SupportedLanguageType, string> = {
	en: "English",
	es: "Español",
	zh: "中文",
};

export type SupportedLanguageType =
	(typeof SupportedLanguage)[keyof typeof SupportedLanguage];

export const SupportedLanguageSchema: Schema.Schema<
	SupportedLanguageType,
	SupportedLanguageType,
	never
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

export const defaultLanguage: SupportedLanguageType = SupportedLanguage.en;
