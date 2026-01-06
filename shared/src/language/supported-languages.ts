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

export type SupportedLanguageType = (typeof SupportedLanguage)[keyof typeof SupportedLanguage];

export const defaultLanguage: SupportedLanguageType = SupportedLanguage.en;
