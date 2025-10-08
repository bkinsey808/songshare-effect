import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { detectInitialLanguage } from "../language/detectInitialLanguage";
// Import translation resources
import en from "./resources/en.json";
import es from "./resources/es.json";
import zh from "./resources/zh.json";
import type { SupportedLanguageType } from "@/shared/language/supportedLanguages";

const resources: Record<
	SupportedLanguageType,
	{ translation: Record<string, unknown> }
> = {
	en: { translation: en },
	es: { translation: es },
	zh: { translation: zh },
} as const;

const initialLanguage = detectInitialLanguage();

// eslint-disable-next-line import-x/no-named-as-default-member
void i18n.use(initReactI18next).init({
	resources,
	// Set initial language from URL
	lng: initialLanguage,
	fallbackLng: "en",
	// Enable debug in development only
	debug: import.meta.env.DEV === true,

	// Disable automatic detection - handled by middleware
	detection: { order: [] },

	interpolation: {
		// React already escapes values
		escapeValue: false,
	},

	// Enable Suspense for smooth loading transitions
	react: {
		useSuspense: true,
	},
});

export default i18n;
