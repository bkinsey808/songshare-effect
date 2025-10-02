// Translation resources type for type safety
export type TranslationResources = {
	common: {
		loading: string;
		error: string;
		cancel: string;
		save: string;
	};
	navigation: {
		home: string;
		songs: string;
		upload: string;
		about: string;
		suspenseUse: string;
		userSubscription: string;
		switchLanguage: string;
	};
	pages: {
		home: {
			title: string;
			subtitle: string;
		};
		// Add other page translations as needed
	};
};

// Extend react-i18next for TypeScript autocomplete
declare module "react-i18next" {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: {
			translation: TranslationResources;
		};
	}
}
