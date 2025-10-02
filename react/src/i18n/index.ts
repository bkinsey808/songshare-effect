import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation resources
import en from "./resources/en.json";
import es from "./resources/es.json";
import zh from "./resources/zh.json";
import type { SupportedLanguage } from "@/shared/supportedLanguages";

const resources: Record<
	SupportedLanguage,
	{ translation: Record<string, unknown> }
> = {
	en: { translation: en },
	es: { translation: es },
	zh: { translation: zh },
} as const;

void i18n.use(initReactI18next).init({
	resources,
	lng: "en", // Default - overridden by LanguageProvider
	fallbackLng: "en",
	debug: import.meta.env.DEV === true,

	// Disable automatic detection - handled by middleware
	detection: { order: [] },

	interpolation: {
		escapeValue: false, // React already escapes values
	},

	// Enable Suspense for loading states
	react: {
		useSuspense: true,
	},
});

export default i18n;
