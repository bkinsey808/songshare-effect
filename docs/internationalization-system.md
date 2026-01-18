````markdown
# Internationalization (i18n) System Documentation

## Overview

The SongShare Effect application features a comprehensive internationalization system that provides seamless multilingual support with intelligent language detection, URL-based routing, and preserved user preferences. The system is built on `react-i18next` with custom routing integration and preference management.

## Supported Languages

Currently supported languages:

- **English (en)** - Default language
- **Spanish (es)** - Español
- **Chinese (zh)** - 中文

## File Organization

### Language Module Structure

```
react/src/language/
├── detectInitialLanguage.ts    # Core language detection logic
├── LanguageDetector.tsx        # Root path redirect component
├── LanguageProvider.tsx        # Context provider for language state
├── LanguageSwitcher.tsx        # UI component for manual switching
├── languageStorage.ts          # Persistence layer (localStorage + cookies)
└── useLanguage.ts             # Custom hook for language operations
```

### Shared Language Utilities

```
shared/language/
├── detectBrowserLanguage.ts   # Browser Accept-Language parsing
├── parseLanguageCookie.ts     # Cookie-based preference extraction
└── supportedLanguages.ts      # Type definitions and constants
```

### i18n Configuration

```
react/src/i18n/
├── index.ts                   # Main i18next configuration
└── resources/                 # Translation files
    ├── en.json               # English translations
    ├── es.json               # Spanish translations
    └── zh.json               # Chinese translations
```

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  URL Detection  │────▶│ Language Router │────▶│   Components    │
│ detectInitial() │     │   & Provider    │     │  with i18next   │
│  (own module)   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Preference     │     │   Translation   │     │   Suspense      │
│   Storage       │     │    Resources    │     │   Boundaries    │
│ (Cookie + LS)   │     │  (JSON files)   │     │  (Loading UI)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Core Components

### 1. Language Detection & Initial Setup

#### `detectInitialLanguage()` in `/react/src/language/detectInitialLanguage.ts`

**Dedicated module** for language detection logic with smart priority system.

Determines the initial language using this priority order:

1. **URL Parameter** - `/zh/` → Chinese (highest priority)
2. **Stored Preference** - localStorage/cookies
3. **Browser Language** - `navigator.language` parsing
4. **Default Fallback** - English

```typescript
// /react/src/language/detectInitialLanguage.ts
import { SUPPORTED_LANGUAGES } from "@/shared/language/supportedLanguages";

export const detectInitialLanguage = (): SupportedLanguage => {
	// 1. Check URL parameter (highest priority for explicit navigation)
	const path = globalThis.location.pathname;
	const langMatch = path.match(/^\/([a-z]{2})\//);
	if (langMatch !== null && langMatch[1] !== undefined && langMatch[1] !== "") {
		const urlLang = langMatch[1];
		if (SUPPORTED_LANGUAGES.includes(urlLang as SupportedLanguage)) {
			return urlLang as SupportedLanguage;
		}
	}

	// 2. Check stored preference in localStorage
	// 3. Check stored preference in cookies
	// 4. Detect from browser language
	// 5. Default fallback to "en"
};
```

**Key Features:**

- **Modular Design**: Separated from i18n configuration for better organization
- **Shared Constants**: Uses `SUPPORTED_LANGUAGES` array for consistency
- **Type Safety**: Full TypeScript support with proper type guards
- **Reusable**: Can be imported by other components when needed

### 2. Language Routing System

#### Route Structure

```
/ (root)
├── LanguageDetector (redirects to /{lang}/)
└── /:lang (language-prefixed routes)
    └── LanguageProvider (manages language context)
        └── Layout (shared UI)
            ├── / (HomePage)
            ├── /songs
            ├── /upload
            ├── /about
            └── ... (other pages)
```

#### `LanguageDetector` - `/react/src/language/LanguageDetector.tsx`

Handles root path (`/`) visits:

- Detects user's preferred language
- Redirects to appropriate language route (`/{lang}/`)

```typescript
// Priority: stored preference → browser detection → fallback
const selectedLang = storedLang ?? browserLang;
navigate(`/${selectedLang}/`, { replace: true });
```

#### `LanguageProvider` - `/react/src/language/LanguageProvider.tsx`

Manages language-prefixed routes (`/:lang/*`):

- Validates language parameter
- Switches i18next language
- Manages preference storage
- Provides Suspense boundaries

**Key Features:**

- **URL Validation**: Redirects invalid languages to `/en/`
- **Smart Preferences**: Only updates stored preference for new users
- **Suspense Integration**: Automatic loading states during language changes

### 3. Translation Resources

#### File Structure

```
react/src/i18n/resources/
├── en.json (English - base language)
├── es.json (Spanish)
└── zh.json (Chinese)
```

#### Translation Schema

```typescript
{
  "app": {
    "title": "SongShare Effect",
    "subtitle": "Share your favorite songs with the world"
  },
  "navigation": {
    "home": "Home",
    "songs": "Songs",
    "upload": "Upload",
    "about": "About",
    "suspenseUse": "Suspense Use",
    "userSubscription": "User Subscription",
    "switchLanguage": "Switch Language"
  },
  "pages": {
    "home": {
      "title": "Welcome to SongShare",
      "subtitle": "Share your music with the world"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "cancel": "Cancel",
    "save": "Save"
  }
}
```

### 4. Language Switching Components

#### `LanguageSwitcher` - `/react/src/language/LanguageSwitcher.tsx`

Dropdown component for manual language switching:

- Updates stored preference
- Navigates to new language URL
- Preserves current path

```typescript
const handleLanguageChange = (newLang: SupportedLanguage) => {
	setStoredLanguage(newLang); // Update preference
	navigate(`/${newLang}${currentPath}`); // Navigate with same path
};
```

#### `useLanguage` Hook - `/react/src/language/useLanguage.ts`

Custom hook for language operations:

```typescript
const { currentLanguage, switchLanguage, getLocalizedPath } = useLanguage();

// Switch to Spanish
switchLanguage("es");

// Get localized URL
const spanishUrl = getLocalizedPath("/songs", "es"); // → '/es/songs'
```

Convenience wrapper — `useLocale`

If your component needs both the narrowed runtime language *and* the `t` function,
use `useLocale()` for a concise, type-safe pattern:

```typescript
const { lang, t } = useLocale();
<Link to={`/${lang}/songs`}>{t('navigation.home')}</Link>
```


### 5. Preference Storage System

#### Dual Storage Strategy

- **localStorage**: Client-side persistence, faster access
- **Cookies**: Server-side compatibility, cross-session persistence

#### `languageStorage.ts` Functions

**`setStoredLanguage(language)`**

```typescript
// Sets both localStorage and cookie
setStoredLanguage("zh");
// Result:
// - localStorage['preferred-language'] = 'zh'
// - Cookie: preferred-language=zh; path=/; expires=...
```

**`getStoredLanguage()`**

```typescript
// Priority: localStorage → cookies → undefined
const preference = getStoredLanguage();
```

## User Experience Flows

### 🆕 New User Journey

1. **First Visit** (`/`) → Browser language detected → Redirected to `/es/` (if Spanish browser)
2. **Preference Stored** → Future visits to `/` → Automatic redirect to `/es/`
3. **Manual Change** → Uses language switcher → Preference updated

### 👤 Returning User Journey

1. **Direct Visit** (`/zh/`) → Chinese displayed immediately
2. **Stored Preference** (`es`) → Preference preserved (not overwritten)
3. **Root Visit** (`/`) → Redirected to `/es/` (stored preference)

### 🔗 External Link Handling

1. **Shared Link** (`/zh/songs`) → Chinese displayed immediately
2. **No Preference Change** → Original preference preserved
3. **Explicit Choice** → Only updated via language switcher

## Implementation Examples

### Using Translations in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('pages.home.title')}</h1>
      <p>{t('pages.home.subtitle')}</p>
    </div>
  );
}
```

### Type-Safe Translations

```typescript
// types.ts defines the translation structure
interface TranslationResources {
	pages: {
		home: {
			title: string;
			subtitle: string;
		};
	};
}

// Provides autocomplete and type checking
t("pages.home.title"); // ✅ Valid
t("pages.invalid.key"); // ❌ TypeScript error
```

### Creating Language Links

```typescript
import { useLanguage } from '@/react/src/language/useLanguage';

function LanguageAwareLink() {
  const { getLocalizedPath } = useLanguage();

  return (
    <Link to={getLocalizedPath('/songs')}>
      {/* Automatically resolves to /zh/songs, /es/songs, etc. */}
      View Songs
    </Link>
  );
}
```

## Configuration

### i18next Configuration (`/react/src/i18n/index.ts`)

```typescript
import detectInitialLanguage from "../language/detectInitialLanguage";

i18n.use(initReactI18next).init({
	resources,
	lng: detectInitialLanguage(), // Import from dedicated module
	fallbackLng: "en",
	debug: import.meta.env.DEV === true, // Debug only in development

	// Disable automatic detection (we handle it manually)
	detection: { order: [] },

	interpolation: {
		escapeValue: false, // React already escapes
	},

	react: {
		useSuspense: true, // Enable Suspense boundaries
	},
});
```

### Supported Languages (`/shared/language/supportedLanguages.ts`)

```typescript
export const SUPPORTED_LANGUAGES = ["en", "es", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
```

## Browser Language Detection

### Algorithm (`/shared/language/detectBrowserLanguage.ts`)

1. **Parse Accept-Language Header**: `"en-US,en;q=0.9,es;q=0.8"`
2. **Extract Language Codes**: `["en", "es"]`
3. **Match Against Supported**: First supported language wins
4. **Fallback**: English if no matches

```typescript
detectBrowserLanguage("zh-CN,zh;q=0.9,en;q=0.8");
// → "zh" (Chinese detected and supported)

detectBrowserLanguage("fr-FR,fr;q=0.9");
// → "en" (French not supported, fallback to English)
```

## Performance Considerations

### Suspense Integration

- **No FOUC**: Components suspend until translations load
- **Smooth Transitions**: Loading states during language changes
- **Automatic**: No manual loading state management needed

### Resource Loading

- **Lazy Loading**: Only active language resources loaded
- **Caching**: i18next caches loaded translations
- **Bundle Optimization**: Translation files separate from main bundle

### URL-Based Initialization

- **No Flash**: Correct language detected from URL immediately
- **SEO Friendly**: Each language has distinct URLs
- **Shareable**: Direct links work correctly

## SEO & Accessibility

### URL Structure

- **Language-Prefixed**: `/zh/about`, `/es/songs`
- **Consistent**: Same content structure across languages
- **Canonical**: Each language version has unique URL

### HTML Lang Attribute

```typescript
// Automatically set by LanguageProvider
document.documentElement.lang = currentLang;
// Result: <html lang="zh"> for Chinese pages
```

### Screen Reader Support

- Language switcher has proper ARIA labels
- Content language changes announced
- Semantic HTML maintained across languages

## Adding New Languages

### 1. Update Supported Languages

```typescript
// shared/language/supportedLanguages.ts
export const SUPPORTED_LANGUAGES = ["en", "es", "zh", "fr"] as const;
```

### 2. Create Translation File

```json
// react/src/i18n/resources/fr.json
{
	"app": {
		"title": "SongShare Effect",
		"subtitle": "Partagez vos chansons préférées avec le monde"
	}
	// ... complete translation structure
}
```

### 3. Update Resource Import

```typescript
// react/src/i18n/index.ts
import fr from "./resources/fr.json";

const resources = {
	en: { translation: en },
	es: { translation: es },
	zh: { translation: zh },
	fr: { translation: fr }, // Add new language
};
```

**Note**: The `detectInitialLanguage` function automatically uses the `SUPPORTED_LANGUAGES` constant, so no additional changes are needed in the detection logic.

### 4. Update Language Switcher

```typescript
// react/src/language/LanguageSwitcher.tsx
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
	en: "English",
	es: "Español",
	zh: "中文",
	fr: "Français", // Add display name
};
```

## Troubleshooting

### Common Issues

**❌ Translations not updating**

- Check if `useSuspense: true` in i18n config
- Verify translation keys exist in all language files
- Ensure `useTranslation()` hook is used correctly

**❌ URL routing not working**

- Verify language is in `SUPPORTED_LANGUAGES` array
- Check React Router configuration
- Ensure `LanguageProvider` wraps routes correctly

**❌ Preferences not persisting**

- Check localStorage/cookie storage in browser
- Verify `setStoredLanguage()` is called on explicit changes
- Test in incognito mode to check cookie settings

**❌ Browser detection incorrect**

- Test `navigator.language` value in browser console
- Check `detectBrowserLanguage()` function logic
- Verify fallback behavior to English

### Debug Mode

Enable detailed logging in development:

```typescript
// i18n config
debug: import.meta.env.DEV === true;
```

View in browser console:

- Language detection decisions
- Translation loading status
- Preference storage operations

## Best Practices

### Code Organization

- **Modular Structure**: Separate language detection from i18n configuration
- **Shared Constants**: Use `SUPPORTED_LANGUAGES` for consistency across modules
- **Single Responsibility**: Each file handles one aspect of internationalization
- **Reusable Utilities**: Common functions in shared directory for cross-platform use

### Translation Keys

- **Hierarchical**: Use nested structure (`pages.home.title`)
- **Descriptive**: Clear key names for maintainability
- **Consistent**: Same structure across all language files

### User Experience

- **Preserve Context**: Keep user on same page when switching languages
- **Respect Choice**: Don't override explicit language preferences
- **Smooth Transitions**: Use Suspense for loading states

### Performance

- **Lazy Load**: Only load needed translations
- **Cache Effectively**: Let i18next handle resource caching
- **Minimize FOUC**: Initialize with correct language immediately

## Future Enhancements

### Potential Improvements

1. **RTL Support**: Right-to-left languages (Arabic, Hebrew)
2. **Pluralization**: Advanced plural forms per language
3. **Date/Time Formatting**: Locale-specific formatting
4. **Number Formatting**: Currency and number localization
5. **Server-Side Detection**: Cookie-based initial language on server
6. **Language Auto-Detection**: Smart switching based on content

### Scaling Considerations

- **Translation Management**: External services (Lokalise, Crowdin)
- **Bundle Splitting**: Dynamic import of translation files
- **CDN Distribution**: Serve translations from CDN
- **Translation Automation**: Automated translation workflows

---

This internationalization system provides a robust foundation for multilingual support with excellent user experience, performance, and maintainability. The architecture is designed to scale with additional languages and features while maintaining simplicity for developers.

```markdown

```
````
