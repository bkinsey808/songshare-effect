import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";

// Import translation resources
import { detectInitialLanguage } from "@/react/language/detectInitialLanguage";

import en from "./resources/en.json";
import es from "./resources/es.json";
import zh from "./resources/zh.json";

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
	// Enable debug only when explicitly requested. This keeps dev-time
	// i18next noise quiet for Playwright/dev runs unless you set
	// VITE_I18NEXT_DEBUG=true (or "1").
	debug:
		import.meta.env["VITE_I18NEXT_DEBUG"] === "1" ||
		import.meta.env["VITE_I18NEXT_DEBUG"] === "true",

	// Disable automatic detection - handled by middleware
	detection: { order: [] },

	interpolation: {
		// React already escapes values
		escapeValue: false,
	},

	// Enable Suspense for smooth loading transitions
	react: {
		useSuspense: false,
	},
});

export default i18n;
