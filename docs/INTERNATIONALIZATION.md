# Internationalization (i18n) Implementation Guide

This document provides a comprehensive guide for implementing internationalization in the SongShare Effect application using `react-i18next` with Cloudflare Pages Functions.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start (AI Agent Guide)](#quick-start-ai-agent-guide)
4. [Core Implementation](#core-implementation)
5. [React Components](#react-components)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

### System Features

The application supports multiple languages with URL-based language routing:

- **Supported Languages**: English (`en`), Spanish (`es`), Chinese (`zh`)
- **URL Structure**: `/{lang}/path` (e.g., `/en/songs`, `/es/about`)
- **Server-Side Detection**: Automatic language detection with HTTP 302 redirects
- **User Preferences**: Cookie (server API communication) + localStorage (client performance)
- **API Localization**: Server responses in user's preferred language
- **Type Safety**: Full TypeScript support with translation key validation

### Implementation Choice

We use **Cloudflare Pages Functions middleware** (`functions/_middleware.ts`) for dynamic language detection and HTTP 302 redirects. This provides:

✅ **Optimal User Experience**: Users land immediately in their preferred language  
✅ **SEO Benefits**: Proper HTTP redirects and language-specific URLs  
✅ **Performance**: Edge-based detection with minimal latency  
✅ **Maintainability**: Single file, automatic deployment

## Architecture

### Language Detection Flow

1. **Root Access (`/`)**: When users visit the root URL, the system **always** redirects:
   - Server-side: Returns HTTP 302 (Found) redirect based on user's preferred language (cookie first, then `Accept-Language` header)
   - Client-side fallback: React Router navigation for SPA scenarios
   - Analyzes browser language preferences against supported languages
   - Redirects to the best matching language path (e.g., `/es/` for Spanish browsers)
   - Falls back to English (`/en/`) if no supported language is detected
   - **Important**: The root `/` path never serves content directly

2. **Language Path Access (`/en/`, `/es/`, etc.)**: Direct access to language-specific paths loads the application in that language.

### Supported Languages

```typescript
const SUPPORTED_LANGUAGES = ["en", "es", "zh"] as const;
```

- `en` - English (default/fallback)
- `es` - Spanish (Español)
- `zh` - Chinese (中文)

### Language Detection Priority

The system follows this detection order:

1. **🎯 URL Language Parameter**: `/es/songs` → Spanish (highest priority)
2. **🍪 Cookie Preference**: `preferred-language=zh` → Chinese (returning users)
3. **🌐 Accept-Language Header**: Browser language → Best match (first-time users)
4. **🔄 Default Fallback**: English (`en`) → Safety net

### Why Cookie AND localStorage?

The system uses **dual persistence** for optimal performance and functionality:

#### 🍪 **Cookies: Server Communication**

- **Automatic inclusion**: Sent with every HTTP request without client-side code
- **Server-side detection**: Pages Functions middleware can read user preference immediately
- **API localization**: Server responses automatically in user's preferred language
- **Cross-request persistence**: Works across page reloads and direct URL access

#### 💾 **localStorage: Client Performance**

- **Fast client access**: No HTTP header parsing required for React components
- **Immediate availability**: Instant language switching in UI without server round-trip
- **Backup mechanism**: Works when cookies are disabled by privacy settings
- **Larger capacity**: Not limited by cookie size restrictions (4KB)

**Example Flow:**

```typescript
// Client sets both for different purposes
export const setStoredLanguage = (language: SupportedLanguage): void => {
	// Cookie: Required for server API communication
	document.cookie = `preferred-language=${language}; path=/; SameSite=Lax`;

	// localStorage: Fast client-side access
	localStorage.setItem("preferred-language", language);
};

// Server reads cookie (localStorage not available server-side)
export const onRequest: PagesFunction = async (context) => {
	const cookies = context.request.headers.get("Cookie") || "";
	const userLang = parseLanguageCookie(cookies); // ← Only cookies work here
	return Response.redirect(`/${userLang}/`, 302);
};

// Client reads localStorage (faster than parsing cookies)
const getSavedLanguage = (): SupportedLanguage | null => {
	return localStorage.getItem("preferred-language") as SupportedLanguage;
};
```

## Quick Start (AI Agent Guide)

This section provides step-by-step implementation commands for AI agents. All code is production-ready and can be copied directly.

### Phase 1: Setup and Dependencies

```bash
# Install dependencies
npm install react-i18next@^15.0.0 i18next@^23.15.0
npm install -D @types/react-i18next

# Create directory structure
mkdir -p functions
mkdir -p react/src/i18n/resources
mkdir -p react/src/components
mkdir -p shared/utils

# Verify installation
npm list react-i18next i18next
```

### Phase 2: Core Type Definitions

**File:** `shared/types/index.ts`

```typescript
export const SUPPORTED_LANGUAGES = ["en", "es", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
```

**File:** `shared/utils/languageStorage.ts`

```typescript
import type { SupportedLanguage } from "@/shared/types";
import { SUPPORTED_LANGUAGES } from "@/shared/types";

export const LANGUAGE_COOKIE_NAME = "preferred-language";

export const setStoredLanguage = (language: SupportedLanguage): void => {
	if (typeof document !== "undefined") {
		const expires = new Date();
		expires.setDate(expires.getDate() + 365);
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
	}
	if (typeof window !== "undefined") {
		localStorage.setItem("preferred-language", language);
	}
};

export const parseLanguageCookie = (
	cookieHeader: string | null,
): SupportedLanguage | null => {
	if (!cookieHeader) return null;
	const match = cookieHeader
		.split(";")
		.find((cookie) => cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`));
	if (match) {
		const lang = match.split("=")[1];
		return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
			? (lang as SupportedLanguage)
			: null;
	}
	return null;
};

export function detectBrowserLanguage(
	acceptLanguage?: string,
): SupportedLanguage {
	if (!acceptLanguage) return "en";
	const languages = acceptLanguage
		.split(",")
		.map((lang) => lang.split(";")[0].split("-")[0].trim().toLowerCase());
	for (const lang of languages) {
		if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
			return lang as SupportedLanguage;
		}
	}
	return "en";
}
```

### Phase 3: Pages Functions Middleware

**File:** `functions/_middleware.ts`

```typescript
import type { SupportedLanguage } from "@/shared/types";
import {
	detectBrowserLanguage,
	parseLanguageCookie,
} from "@/shared/utils/languageStorage";

export interface Env {}

export const onRequest: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);

	if (url.pathname === "/") {
		let detectedLang: SupportedLanguage = "en";

		// Check cookie first
		const cookies = context.request.headers.get("Cookie") || "";
		const cookieLang = parseLanguageCookie(cookies);

		if (cookieLang) {
			detectedLang = cookieLang;
		} else {
			// Fallback to browser language
			const acceptLanguage =
				context.request.headers.get("Accept-Language") || "";
			detectedLang = detectBrowserLanguage(acceptLanguage);
		}

		return Response.redirect(`${url.origin}/${detectedLang}/`, 302);
	}

	return context.next();
};
```

### Phase 4: React Components

**File:** `react/src/components/LanguageProvider.tsx`

```typescript
import { Suspense, useEffect } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/shared/types';
import type { SupportedLanguage } from '@/shared/types';
import { setStoredLanguage } from '@/shared/utils/languageStorage';

function LanguageProviderInner() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  if (!lang || !SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
    return <Navigate to="/en/" replace />;
  }

  const currentLang = lang as SupportedLanguage;

  useEffect(() => {
    if (i18n.language !== currentLang) {
      i18n.changeLanguage(currentLang);
    }
    setStoredLanguage(currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang, i18n]);

  return <Outlet />;
}

export default function LanguageProvider() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LanguageProviderInner />
    </Suspense>
  );
}
```

**File:** `react/src/components/LanguageDetector.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectBrowserLanguage } from '@/shared/utils/languageStorage';

export default function LanguageDetector() {
  const navigate = useNavigate();

  useEffect(() => {
    const detectedLang = detectBrowserLanguage(navigator.language);
    navigate(`/${detectedLang}/`, { replace: true });
  }, [navigate]);

  return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
}
```

### Phase 5: Router Integration

**File:** `react/src/App.tsx` (Critical Changes)

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LanguageDetector from './components/LanguageDetector';
import LanguageProvider from './components/LanguageProvider';
// Import your existing components

const router = createBrowserRouter([
  {
    path: "/",
    element: <LanguageDetector />, // NEW: Handles root redirects
  },
  {
    path: "/:lang", // NEW: Language-prefixed routes
    element: <LanguageProvider />, // NEW: Language context + Suspense
    children: [
      {
        path: "",
        element: <Layout />, // Your existing layout
        children: [
          { index: true, element: <HomePage /> },
          { path: "songs", element: <SongsPage /> },
          // Move ALL existing routes here under /:lang
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

### Phase 6: Translation Files

Create translation files with the following command:

```bash
# Create English base translations
cat > react/src/i18n/resources/en.json << 'EOF'
{
  "navigation": {
    "home": "Home",
    "songs": "Songs",
    "upload": "Upload",
    "about": "About"
  },
  "pages": {
    "home": {
      "title": "Welcome to SongShare",
      "subtitle": "Share your music with the world"
    }
  }
}
EOF

# Create Spanish translations
cat > react/src/i18n/resources/es.json << 'EOF'
{
  "navigation": {
    "home": "Inicio",
    "songs": "Canciones",
    "upload": "Subir",
    "about": "Acerca de"
  },
  "pages": {
    "home": {
      "title": "Bienvenido a SongShare",
      "subtitle": "Comparte tu música con el mundo"
    }
  }
}
EOF

# Chinese translations
cat > react/src/i18n/resources/zh.json << 'EOF'
{
  "navigation": {
    "home": "首页",
    "songs": "歌曲",
    "upload": "上传",
    "about": "关于"
  },
  "pages": {
    "home": {
      "title": "欢迎来到 SongShare",
      "subtitle": "与世界分享您的音乐"
    }
  }
}
EOF
```

### Phase 7: Update Components

**Update page components:**

```typescript
// BEFORE
function HomePage() {
  return <h1>Welcome to SongShare</h1>;
}

// AFTER
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t } = useTranslation();
  return <h1>{t('pages.home.title')}</h1>;
}
```

**Update navigation links:**

```typescript
// BEFORE
<Link to="/songs">Songs</Link>

// AFTER
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
const currentLang = i18n.language;
<Link to={`/${currentLang}/songs`}>{t('navigation.songs')}</Link>
```

### Phase 8: Validation

```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test language detection
curl -H "Accept-Language: es" http://localhost:5173/
# Expected: 302 redirect to /es/

# Test development server
npm run dev
```

## Core Implementation

### Dependencies

```json
{
	"dependencies": {
		"react-i18next": "^15.0.0",
		"i18next": "^23.15.0"
	},
	"devDependencies": {
		"@types/react-i18next": "^8.1.0"
	}
}
```

### File Structure

```
functions/
└── _middleware.ts           # Server-side language detection

react/src/
├── i18n/
│   ├── index.ts            # i18n configuration with Suspense
│   ├── types.ts            # TypeScript definitions
│   └── resources/          # Translation files
│       ├── en.json         # English (default)
│       ├── es.json         # Spanish
│       └── zh.json         # Chinese
├── components/
│   ├── LanguageDetector.tsx # Root path redirect handler
│   ├── LanguageProvider.tsx # Language context + Suspense
│   └── LanguageSwitcher.tsx # UI language selection
└── hooks/
    └── useLanguage.ts      # Language utilities

shared/
├── types/index.ts          # Shared language types
└── utils/
    └── languageStorage.ts  # Cookie/localStorage utilities
```

### Integration Points

- **Functions**: Configured in `tsconfig.functions.json` with Cloudflare Workers types
- **React i18n**: Included in `tsconfig.app.json` with DOM types
- **Shared Code**: Used by both client and server for consistency
- **ESLint**: Appropriate rules for each environment

### i18n Configuration

**File:** `react/src/i18n/index.ts`

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation resources
import en from "./resources/en.json";
import es from "./resources/es.json";
import zh from "./resources/zh.json";

const resources = {
	en: { translation: en },
	es: { translation: es },
	zh: { translation: zh },
};

i18n.use(initReactI18next).init({
	resources,
	lng: "en", // Default - overridden by LanguageProvider
	fallbackLng: "en",
	debug: import.meta.env.DEV,

	// Disable automatic detection - handled by middleware
	detection: { order: [] },

	interpolation: {
		escapeValue: false, // React already escapes
	},

	// Enable Suspense for loading states
	react: {
		useSuspense: true,
	},
});

export default i18n;
```

**Note:** We don't use `i18next-browser-languagedetector` since language detection is handled by our Cloudflare Pages Functions middleware for better SEO and performance.

### TypeScript Type Definitions

**File:** `react/src/i18n/types.ts`

```typescript
// Translation resources interface for type safety
export interface TranslationResources {
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
	};
	pages: {
		home: {
			title: string;
			subtitle: string;
		};
		// Add other page translations...
	};
}

// Extend react-i18next for TypeScript autocomplete
declare module "react-i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: {
			translation: TranslationResources;
		};
	}
}
```

## React Components

### Core Components

The React implementation uses three key components that work together to provide language routing and context.

#### LanguageDetector

Handles root path (`/`) redirects to appropriate language paths.

```typescript
// react/src/components/LanguageDetector.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectBrowserLanguage } from '@/shared/utils/languageStorage';

export default function LanguageDetector() {
  const navigate = useNavigate();

  useEffect(() => {
    // Client-side fallback for SPA routing
    const detectedLang = detectBrowserLanguage(navigator.language);
    navigate(`/${detectedLang}/`, { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>Detecting your language...</div>
    </div>
  );
}
```

#### LanguageProvider

Provides language context and validation with built-in Suspense support.

```typescript
// react/src/components/LanguageProvider.tsx
import { Suspense, useEffect } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/shared/types';
import type { SupportedLanguage } from '@/shared/types';
import { setStoredLanguage } from '@/shared/utils/languageStorage';

function LanguageProviderInner() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  // Validate language parameter
  if (!lang || !SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
    return <Navigate to="/en/" replace />;
  }

  const currentLang = lang as SupportedLanguage;

  useEffect(() => {
    // Change i18n language if different
    if (i18n.language !== currentLang) {
      i18n.changeLanguage(currentLang);
    }

    // Save preference and update HTML lang
    setStoredLanguage(currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang, i18n]);

  return <Outlet />;
}

export default function LanguageProvider() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading translations...</div>
      </div>
    }>
      <LanguageProviderInner />
    </Suspense>
  );
}
```

#### LanguageSwitcher

UI component for manual language selection.

```typescript
// react/src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '@/shared/types';
import type { SupportedLanguage } from '@/shared/types';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
};

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const currentLang = i18n.language as SupportedLanguage;
  const currentPath = location.pathname.substring(3) || '/';

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (newLang !== currentLang) {
      navigate(`/${newLang}${currentPath}`);
    }
  };

  return (
    <select
      value={currentLang}
      onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
      className="px-3 py-1 border rounded-md bg-white"
      aria-label={t('language.switch_language')}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_NAMES[lang]}
        </option>
      ))}
    </select>
  );
}
```

### Router Migration

The key change is restructuring your router to support language-prefixed paths:

```typescript
// BEFORE: Flat structure
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "songs", element: <SongsPage /> },
      // ... other routes
    ],
  },
]);

// AFTER: Language-nested structure
const router = createBrowserRouter([
  {
    path: "/",
    element: <LanguageDetector />, // NEW: Root redirects
  },
  {
    path: "/:lang", // NEW: Language parameter
    element: <LanguageProvider />, // NEW: Language context + Suspense
    children: [
      {
        path: "",
        element: <Layout />, // MOVED: Under language route
        children: [
          { index: true, element: <HomePage /> }, // NOW: /:lang/
          { path: "songs", element: <SongsPage /> }, // NOW: /:lang/songs
          // ... all routes moved here
        ],
      },
    ],
  },
]);
```

### Custom Hooks

**File:** `react/src/hooks/useLanguage.ts`

```typescript
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { SupportedLanguage } from "@/shared/types";

export function useLanguage() {
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const currentLanguage = i18n.language as SupportedLanguage;
	const currentPath = location.pathname.substring(3) || "/";

	const switchLanguage = (newLang: SupportedLanguage) => {
		if (newLang !== currentLanguage) {
			navigate(`/${newLang}${currentPath}`);
		}
	};

	const getLocalizedPath = (path: string, lang?: SupportedLanguage) => {
		const targetLang = lang || currentLanguage;
		const cleanPath = path.startsWith("/") ? path : `/${path}`;
		return `/${targetLang}${cleanPath}`;
	};

	return {
		currentLanguage,
		switchLanguage,
		getLocalizedPath,
	};
}
```

### Usage in Components

Update your existing components to use translations:

```typescript
// BEFORE: Hardcoded text
function HomePage() {
  return (
    <div>
      <h1>Welcome to SongShare</h1>
      <p>Share your music with the world</p>
    </div>
  );
}

// AFTER: Translated text
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('pages.home.title')}</h1>
      <p>{t('pages.home.subtitle')}</p>
    </div>
  );
}
```

### Navigation Updates

Update navigation components to include language prefixes:

````typescript
// BEFORE: Static links
import { Link } from 'react-router-dom';
<Link to="/songs">Songs</Link>

// AFTER: Language-aware links
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

function Navigation() {
  const { getLocalizedPath } = useLanguage();
  const { t } = useTranslation();

  return (
    <nav>
      <Link to={getLocalizedPath('/')}>
        {t('navigation.home')}
      </Link>
      <Link to={getLocalizedPath('/songs')}>
        {t('navigation.songs')}
      </Link>
    </nav>
  );
}

## API Integration

### Server-Side Language Detection

For API endpoints that need to respond in the user's preferred language:

```typescript
// api/src/middleware/language.ts
import { Context, Next } from "hono";
import type { SupportedLanguage } from "@/shared/types";
import { detectBrowserLanguage, parseLanguageCookie } from "@/shared/utils/languageStorage";

export function detectRequestLanguage(c: Context): SupportedLanguage {
  // Check cookie first (user's explicit preference)
  const cookieHeader = c.req.header("Cookie");
  const cookieLang = parseLanguageCookie(cookieHeader);
  if (cookieLang) return cookieLang;

  // Fall back to Accept-Language header
  const acceptLanguage = c.req.header("Accept-Language") || "";
  return detectBrowserLanguage(acceptLanguage);
}

export const languageMiddleware = async (c: Context, next: Next) => {
  const userLanguage = detectRequestLanguage(c);
  c.set("userLanguage", userLanguage);
  await next();
};
````

### Localized API Responses

```typescript
// api/src/utils/messages.ts
import type { SupportedLanguage } from "@/shared/types";

type MessageKey = "upload.success" | "upload.error" | "validation.required";

const messages: Record<SupportedLanguage, Record<MessageKey, string>> = {
	en: {
		"upload.success": "File uploaded successfully",
		"upload.error": "Failed to upload file",
		"validation.required": "This field is required",
	},
	es: {
		"upload.success": "Archivo subido exitosamente",
		"upload.error": "Error al subir el archivo",
		"validation.required": "Este campo es obligatorio",
	},
	zh: {
		"upload.success": "文件上传成功",
		"upload.error": "文件上传失败",
		"validation.required": "此字段为必填项",
	},
};

export function getLocalizedMessage(
	key: MessageKey,
	language: SupportedLanguage,
): string {
	return messages[language][key] || messages.en[key];
}
```

### API Route Example

```typescript
// api/src/routes/upload.ts
import { Hono } from "hono";

import {
	getLocalizedMessage,
	languageMiddleware,
} from "../middleware/language";

const app = new Hono();
app.use("*", languageMiddleware);

app.post("/upload", async (c) => {
	const userLanguage = c.get("userLanguage");

	try {
		// Upload logic...
		return c.json({
			success: true,
			message: getLocalizedMessage("upload.success", userLanguage),
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: getLocalizedMessage("upload.error", userLanguage),
			},
			400,
		);
	}
});
```

## Testing

### Manual Testing Commands

**Language Detection Flow:**

```bash
# Test root redirect with Spanish preference
curl -H "Accept-Language: es-ES,es;q=0.9" http://localhost:5173/
# Expected: 302 redirect to /es/

# Test cookie-based detection
curl -H "Cookie: preferred-language=zh" http://localhost:5173/
# Expected: 302 redirect to /zh/

# Test unsupported language fallback
curl -H "Accept-Language: fr" http://localhost:5173/
# Expected: 302 redirect to /en/
```

**URL Structure Validation:**

```bash
# Valid language paths
curl -I http://localhost:5173/en/songs    # Expected: 200 OK
curl -I http://localhost:5173/es/about    # Expected: 200 OK
curl -I http://localhost:5173/zh/upload   # Expected: 200 OK

# Invalid language code
curl -I http://localhost:5173/fr/songs    # Expected: Client redirect to /en/songs
```

### Automated Tests

**Unit Tests for Language Detection:**

```typescript
// tests/languageDetection.test.ts
import { detectBrowserLanguage } from "@/shared/utils/languageStorage";

describe("Language Detection", () => {
	it("should detect Spanish from Accept-Language header", () => {
		const result = detectBrowserLanguage("es-ES,es;q=0.9,en;q=0.8");
		expect(result).toBe("es");
	});

	it("should fallback to English for unsupported languages", () => {
		const result = detectBrowserLanguage("fr-FR,fr;q=0.9");
		expect(result).toBe("en");
	});
});
```

**Integration Tests for Components:**

```typescript
// tests/languageSwitching.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LanguageSwitcher from '@/components/LanguageSwitcher';

describe('Language Switching', () => {
  it('should change URL when language is switched', () => {
    render(
      <BrowserRouter>
        <LanguageSwitcher />
      </BrowserRouter>
    );

    const select = screen.getByLabelText(/switch language/i);
    fireEvent.change(select, { target: { value: 'es' } });

    expect(window.location.pathname).toContain('/es/');
  });
});
```

**E2E Tests:**

```typescript
// e2e/language-detection.spec.ts
import { expect, test } from "@playwright/test";

test("should redirect to Spanish when Accept-Language is es", async ({
	page,
	context,
}) => {
	await context.setExtraHTTPHeaders({
		"Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
	});

	await page.goto("/");
	await expect(page).toHaveURL(/\/es\//);
});
```

### TypeScript Validation

```bash
# Validate translation key types
npx tsc --noEmit --skipLibCheck

# Check for missing translations (custom script)
npm run i18n:validate
```

## Deployment

### Cloudflare Pages Configuration

**Directory Structure:**

```
project-root/
├── dist/                    # Built SPA files
│   ├── index.html          # Main entry point
│   └── assets/             # JS, CSS bundles
├── functions/              # Pages Functions
│   └── _middleware.ts      # Language detection middleware
└── wrangler.toml           # Deployment configuration
```

**wrangler.toml Configuration:**

```toml
[build]
command = "npm run build"
publish = "dist"

# Pages Functions automatically detected from /functions directory
compatibility_date = "2023-05-18"
```

### Build and Deploy Commands

```bash
# Build frontend and functions
npm run build:all

# Deploy to Cloudflare Pages
wrangler pages deploy dist

# Or use the deployment task
npm run deploy:api  # If needed for API
```

### Production Validation

```bash
# Test production language detection
curl -H "Accept-Language: es" https://your-app.pages.dev/
# Expected: HTTP/1.1 302 Found, Location: /es/

# Test language-specific paths
curl -I https://your-app.pages.dev/es/songs
# Expected: HTTP/1.1 200 OK

# Test cookie persistence
curl -H "Cookie: preferred-language=zh" https://your-app.pages.dev/
# Expected: HTTP/1.1 302 Found, Location: /zh/
```

### Critical Deployment Requirements

1. **Functions Directory**: Must be named `/functions` at project root
2. **Middleware File**: Must be named `_middleware.ts` with underscore prefix
3. **Build Output**: SPA files in `/dist` directory
4. **TypeScript Config**: Functions configured in `tsconfig.functions.json`

## Best Practices

### Development Best Practices

**1. Type Safety:**

- Use TypeScript interfaces for translation resources
- Validate translation keys at compile time
- Implement proper error boundaries for translation failures

**2. Performance Optimization:**

- Enable Suspense for smooth loading states
- Preload language resources for faster switching
- Use server-side detection to reduce client JavaScript

**3. User Experience:**

- Preserve current page when switching languages
- Provide immediate feedback during language changes
- Handle invalid language codes gracefully

**4. SEO and Accessibility:**

- Update HTML `lang` attribute automatically
- Use proper HTTP 302 redirects for language detection
- Include ARIA labels for language switchers

**5. Cookie Management:**

- Set secure cookie flags in production (`Secure`, `SameSite=Lax`)
- Provide user control over language preferences
- Use reasonable expiration times (1 year recommended)

### Navigation Best Practices

**Always Include Language Prefix:**

```typescript
// ✅ Correct - maintains language context
<Link to={`/${currentLang}/songs`}>Songs</Link>

// ❌ Wrong - would lose language context
<Link to="/songs">Songs</Link>
```

**Use Translation Keys:**

```typescript
// ✅ Correct - translatable
<span>{t('navigation.home')}</span>

// ❌ Wrong - hardcoded text
<span>Home</span>
```

**Update Programmatic Navigation:**

```typescript
// ✅ Correct - language-aware
const { getLocalizedPath } = useLanguage();
navigate(getLocalizedPath("/songs"));

// ❌ Wrong - loses language context
navigate("/songs");
```

## Troubleshooting

### Common Issues and Solutions

**1. Root Path Not Redirecting:**

- Verify `functions/_middleware.ts` exists at project root
- Check file name uses underscore prefix (`_middleware.ts`)
- Ensure Pages Functions are deployed with the app

**2. Cookies Not Working:**

- Check browser DevTools → Application → Cookies
- Verify cookie name matches (`preferred-language`)
- Ensure proper cookie flags are set

**3. TypeScript Errors:**

- Confirm all imports use correct paths (`@/shared/types`)
- Verify type definitions are exported properly
- Check translation resource interfaces match actual JSON files

**4. Missing Translations:**

- Ensure all translation keys exist in ALL language files
- Use consistent nested structure across languages
- Check for typos in translation key paths

**5. Suspense Issues:**

- Verify `react.useSuspense: true` in i18n configuration
- Ensure Suspense boundaries wrap translation-using components
- Check that error boundaries catch translation failures

**6. Language Not Persisting:**

- Verify language parameter is extracted from URL correctly
- Check that `setStoredLanguage()` is called in `LanguageProvider`
- Ensure both cookie and localStorage are being set

### Debug Tools

```typescript
// Add to development builds for debugging
if (import.meta.env.DEV) {
	// Expose i18n instance to browser console
	(window as any).i18n = i18n;

	// Log missing translation keys
	i18n.on("missingKey", (lng, namespace, key) => {
		console.warn(`Missing translation: ${lng}.${namespace}.${key}`);
	});
}
```

### Validation Checklist

Before deploying, verify:

- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] All translation keys exist in all language files
- [ ] Root path redirects work (`curl -H "Accept-Language: es" /`)
- [ ] Language switching preserves current page
- [ ] Invalid language codes redirect to default
- [ ] Cookies are set correctly
- [ ] HTML `lang` attribute updates
- [ ] API responses are localized (if implemented)

## Language Switching Implementation

### Core Language Switching Hook

```typescript
// react/src/hooks/useLanguage.ts - Enhanced with persistence
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { SupportedLanguage } from "@/react/i18n/types";

const LANGUAGE_STORAGE_KEY = "preferred-language";

function useLanguage() {
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	// Save language preference to localStorage
	const saveLanguagePreference = useCallback((lang: SupportedLanguage) => {
		try {
			localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
		} catch (error) {
			console.warn("Failed to save language preference:", error);
		}
	}, []);

	// Get saved language preference
	const getSavedLanguagePreference =
		useCallback((): SupportedLanguage | null => {
			try {
				const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
				return saved as SupportedLanguage | null;
			} catch (error) {
				console.warn("Failed to read language preference:", error);
				return null;
			}
		}, []);

	const switchLanguage = useCallback(
		async (newLang: SupportedLanguage) => {
			const currentPath = location.pathname.substring(3); // Remove /xx/

			// Save preference
			saveLanguagePreference(newLang);

			// Navigate to new language URL
			navigate(`/${newLang}${currentPath}`);

			// Update i18n (may suspend with Suspense)
			await i18n.changeLanguage(newLang);
		},
		[i18n, navigate, location, saveLanguagePreference],
	);

	return {
		currentLanguage: i18n.language as SupportedLanguage,
		switchLanguage,
		getSavedLanguagePreference,
	};
}

export default useLanguage;
```

### Language Switcher Components

#### 1. Dropdown Selector (Compact)

```typescript
// react/src/components/LanguageSwitcher.tsx
import { useLanguage } from '@/react/hooks/useLanguage';
import type { SupportedLanguage } from '@/react/i18n/types';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
] as const;

function LanguageSwitcher(): ReactElement {
  const { currentLanguage, switchLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="relative inline-block">
      <select
        value={currentLanguage}
        onChange={(e) => {
          const newLang = e.target.value as SupportedLanguage;
          void switchLanguage(newLang);
        }}
        aria-label={t('navigation.switchLanguage')}
        className="appearance-none bg-gray-800 text-white px-3 py-2 pr-8 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.flag} {option.nativeName}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
          <path d="M5.3 7.7l4.7 4.7 4.7-4.7L16 9l-6 6-6-6 1.3-1.3z"/>
        </svg>
      </div>
    </div>
  );
}

export default LanguageSwitcher;
```

#### 2. Button Grid (Prominent)

```typescript
// react/src/components/LanguageButtonGrid.tsx
import { useLanguage } from '@/react/hooks/useLanguage';
import type { SupportedLanguage } from '@/react/i18n/types';

const LANGUAGE_OPTIONS = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  { code: 'zh' as const, name: '中文', flag: '🇨🇳' },
];

function LanguageButtonGrid(): ReactElement {
  const { currentLanguage, switchLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-gray-600 w-full mb-2">
        {t('navigation.chooseLanguage')}:
      </span>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          onClick={() => void switchLanguage(option.code)}
          className={`
            px-4 py-2 rounded-lg border-2 transition-all duration-200
            flex items-center gap-2 text-sm font-medium
            ${currentLanguage === option.code
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
            }
          `}
          aria-pressed={currentLanguage === option.code}
        >
          <span className="text-lg">{option.flag}</span>
          <span>{option.name}</span>
        </button>
      ))}
    </div>
  );
}

export default LanguageButtonGrid;
```

#### 3. Floating Language Menu

```typescript
// react/src/components/FloatingLanguageMenu.tsx
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/react/hooks/useLanguage';
import type { SupportedLanguage } from '@/react/i18n/types';

const LANGUAGE_OPTIONS = [
  { code: 'en' as const, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es' as const, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh' as const, name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

function FloatingLanguageMenu(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, switchLanguage } = useLanguage();
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGE_OPTIONS.find(opt => opt.code === currentLanguage);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        aria-label={t('navigation.switchLanguage')}
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentOption?.flag}</span>
        <span className="text-sm">{currentOption?.nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => {
                void switchLanguage(option.code);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3
                ${currentLanguage === option.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
              `}
            >
              <span className="text-lg">{option.flag}</span>
              <div>
                <div className="font-medium">{option.nativeName}</div>
                <div className="text-xs text-gray-500">{option.name}</div>
              </div>
              {currentLanguage === option.code && (
                <span className="ml-auto text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FloatingLanguageMenu;
```

### Integration in Navigation

````typescript
// react/src/components/Navigation.tsx - Updated with language switcher
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher"; // or FloatingLanguageMenu
import type { SupportedLanguage } from '@/react/i18n/types';

function Navigation(): ReactElement {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;

  const navItems = [
    { path: "", labelKey: "navigation.home", icon: "🏠" },
    { path: "songs", labelKey: "navigation.songs", icon: "🎵" },
    { path: "upload", labelKey: "navigation.upload", icon: "📤" },
    { path: "suspense-use", labelKey: "navigation.suspenseUse", icon: "🔄" },
    { path: "user-subscription", labelKey: "navigation.userSubscription", icon: "👥" },
    { path: "about", labelKey: "navigation.about", icon: "ℹ️" },
  ];

  return (
    <nav className="mb-10 flex flex-wrap justify-center gap-5 rounded-xl bg-gray-800 p-5">
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex flex-wrap gap-5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={`/${currentLang}/${item.path}`}
              className="hover:border-primary-500 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-gray-600 bg-transparent px-5 py-3 text-base font-medium text-white transition-all duration-200 hover:bg-gray-700"
            >
              <span>{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          ))}
        </div>

        {/* Language Switcher in Navigation */}
        <div className="ml-4">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
```## Browser Language Detection

The language detection logic:

```typescript
function detectBrowserLanguage(): SupportedLanguage {
	const browserLangs = navigator.languages || [navigator.language];

	for (const browserLang of browserLangs) {
		const lang = browserLang.split("-")[0]; // Extract language code
		if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
			return lang as SupportedLanguage;
		}
	}

	return "en"; // Fallback to English
}
````

### Language Preference Persistence

#### Enhanced Language Detection with User Preferences

```typescript
// shared/utils/languageUtils.ts - Server and client compatible
import type { SupportedLanguage } from "@/shared/types";
import { SUPPORTED_LANGUAGES } from "@/shared/types";

export function detectBrowserLanguage(
	acceptLanguage?: string,
): SupportedLanguage {
	if (!acceptLanguage) return "en";

	const languages = acceptLanguage
		.split(",")
		.map((lang) => lang.split(";")[0].split("-")[0].trim().toLowerCase());

	for (const lang of languages) {
		if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
			return lang as SupportedLanguage;
		}
	}

	return "en";
}

// Client-side only utilities
export function getSavedLanguagePreference(): SupportedLanguage | null {
	if (typeof window === "undefined") return null;

	try {
		const saved = localStorage.getItem("preferred-language");
		return SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)
			? (saved as SupportedLanguage)
			: null;
	} catch (error) {
		console.warn("Failed to read language preference:", error);
		return null;
	}
}

export function saveLanguagePreference(lang: SupportedLanguage): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem("preferred-language", lang);
	} catch (error) {
		console.warn("Failed to save language preference:", error);
	}
}
```

#### Language Detection Priority Order

The system follows this detection priority:

1. **🎯 URL Language Parameter**: `/es/songs` → Spanish (highest priority)
2. **💾 Saved User Preference**: localStorage value (returning users)
3. **🌐 Browser Accept-Language**: HTTP header detection (first-time users)
4. **🔄 Default Fallback**: English (`en`) (safety net)

#### User Experience Flows

**First-Time User Journey:**

```
User visits songshare.app
↓
Browser sends Accept-Language: es-ES,es;q=0.9,en;q=0.8
↓
Server detects Spanish preference
↓
302 Redirect to songshare.app/es/
↓
User sees app in Spanish
↓
User can switch to Chinese via language switcher
↓
Preference saved: localStorage['preferred-language'] = 'zh'
↓
Future visits will use Chinese
```

**Returning User Journey:**

```
User visits songshare.app (localStorage has 'zh')
↓
Client-side detection reads saved preference
↓
Redirects to songshare.app/zh/
↓
User immediately sees Chinese interface
```

#### Cookie-Based Server Communication (Required for API)

**Cookies are essential** when the server API needs to know the user's language preference. Since cookies are automatically sent with every HTTP request, they enable:

- **API Response Localization**: Error messages, validation feedback, email content in user's language
- **Server-Side Language Detection**: Faster initial page loads without client-side redirect
- **Consistent Experience**: Same language across client-side React and server-side API responses

For comprehensive server API integration, implement cookie-based persistence:

```typescript
// functions/_middleware.ts - Enhanced with cookie support
function getCookieValue(cookies: string, name: string): string | null {
	const match = cookies.match(new RegExp(`(^| )${name}=([^;]+)`));
	return match ? decodeURIComponent(match[2]) : null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);

	if (url.pathname === "/") {
		let detectedLang: SupportedLanguage = "en";

		// 1. Check for saved preference cookie
		const cookies = context.request.headers.get("Cookie") || "";
		const savedLang = getCookieValue(cookies, "preferred-language");

		if (
			savedLang &&
			SUPPORTED_LANGUAGES.includes(savedLang as SupportedLanguage)
		) {
			detectedLang = savedLang as SupportedLanguage;
		} else {
			// 2. Fall back to browser language detection
			const acceptLanguage =
				context.request.headers.get("Accept-Language") || "";
			detectedLang = detectBrowserLanguage(acceptLanguage);
		}

		return Response.redirect(`${url.origin}/${detectedLang}/`, 302);
	}

	return context.next();
};

// Client-side: Save to both localStorage and cookie
export function saveLanguagePreference(lang: SupportedLanguage): void {
	// localStorage for client-side detection
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem("preferred-language", lang);
		} catch (error) {
			console.warn("Failed to save to localStorage:", error);
		}
	}

	// Cookie for server-side detection (REQUIRED for API communication)
	if (typeof document !== "undefined") {
		const expires = new Date();
		expires.setDate(expires.getDate() + 365); // 1 year
		document.cookie = `preferred-language=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure=${location.protocol === "https:"}`;
	}
}

// API Integration: Read language from cookie in API requests
export function getLanguageFromRequest(request: Request): SupportedLanguage {
	const cookies = request.headers.get("Cookie") || "";
	const savedLang = getCookieValue(cookies, "preferred-language");

	if (
		savedLang &&
		SUPPORTED_LANGUAGES.includes(savedLang as SupportedLanguage)
	) {
		return savedLang as SupportedLanguage;
	}

	// Fallback to Accept-Language header
	const acceptLanguage = request.headers.get("Accept-Language") || "";
	return detectBrowserLanguage(acceptLanguage);
}

// Usage in API handlers
export async function handleSongUpload(request: Request) {
	const userLanguage = getLanguageFromRequest(request);

	try {
		// Process upload...
		return new Response(
			JSON.stringify({
				message: getLocalizedMessage("upload.success", userLanguage),
			}),
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: getLocalizedMessage("upload.error", userLanguage),
			}),
			{ status: 400 },
		);
	}
}
```

## API Internationalization

### Server-Side Language Detection

The Hono API server must read the user's language preference from cookies to provide localized responses:

```typescript
// api/src/middleware/languageMiddleware.ts
import { Context, Next } from "hono";

import type { SupportedLanguage } from "@/shared/types";
import { SUPPORTED_LANGUAGES } from "@/shared/types";

export function parseLanguageCookie(
	cookieHeader: string | null,
): SupportedLanguage | null {
	if (!cookieHeader) return null;

	const match = cookieHeader
		.split(";")
		.find((cookie) => cookie.trim().startsWith("preferred-language="));

	if (match) {
		const lang = match.split("=")[1].trim();
		return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
			? (lang as SupportedLanguage)
			: null;
	}

	return null;
}

export function detectLanguageFromRequest(c: Context): SupportedLanguage {
	// 1. Try cookie first (user's saved preference)
	const cookieHeader = c.req.header("Cookie");
	const cookieLang = parseLanguageCookie(cookieHeader);
	if (cookieLang) return cookieLang;

	// 2. Fall back to Accept-Language header
	const acceptLanguage = c.req.header("Accept-Language") || "";
	const browserLang = detectBrowserLanguage(acceptLanguage);

	return browserLang;
}

// Middleware to add language to context
export const languageMiddleware = async (c: Context, next: Next) => {
	const userLanguage = detectLanguageFromRequest(c);
	c.set("userLanguage", userLanguage);
	await next();
};
```

### Localized API Responses

```typescript
// api/src/utils/messages.ts
import type { SupportedLanguage } from "@/shared/types";

type MessageKey =
	| "auth.invalid_token"
	| "auth.expired_token"
	| "upload.success"
	| "upload.invalid_file"
	| "upload.too_large"
	| "validation.required_field"
	| "validation.invalid_email"
	| "server.internal_error";

const messages: Record<SupportedLanguage, Record<MessageKey, string>> = {
	en: {
		"auth.invalid_token": "Invalid authentication token",
		"auth.expired_token": "Authentication token has expired",
		"upload.success": "File uploaded successfully",
		"upload.invalid_file": "Invalid file format",
		"upload.too_large": "File size exceeds limit",
		"validation.required_field": "This field is required",
		"validation.invalid_email": "Please enter a valid email address",
		"server.internal_error": "An internal server error occurred",
	},
	es: {
		"auth.invalid_token": "Token de autenticación inválido",
		"auth.expired_token": "El token de autenticación ha expirado",
		"upload.success": "Archivo subido exitosamente",
		"upload.invalid_file": "Formato de archivo inválido",
		"upload.too_large": "El tamaño del archivo excede el límite",
		"validation.required_field": "Este campo es obligatorio",
		"validation.invalid_email": "Por favor ingrese un email válido",
		"server.internal_error": "Ocurrió un error interno del servidor",
	},
	zh: {
		"auth.invalid_token": "无效的身份验证令牌",
		"auth.expired_token": "身份验证令牌已过期",
		"upload.success": "文件上传成功",
		"upload.invalid_file": "无效的文件格式",
		"upload.too_large": "文件大小超出限制",
		"validation.required_field": "此字段为必填项",
		"validation.invalid_email": "请输入有效的电子邮件地址",
		"server.internal_error": "发生内部服务器错误",
	},
};

export function getLocalizedMessage(
	key: MessageKey,
	language: SupportedLanguage,
): string {
	return messages[language][key] || messages.en[key];
}
```

### API Route Examples

```typescript
// api/src/routes/songs.ts
import { Hono } from "hono";

import {
	getLocalizedMessage,
	languageMiddleware,
} from "../middleware/languageMiddleware";

const app = new Hono();

// Apply language middleware to all routes
app.use("*", languageMiddleware);

app.post("/upload", async (c) => {
	const userLanguage = c.get("userLanguage");

	try {
		// File upload logic...

		return c.json({
			success: true,
			message: getLocalizedMessage("upload.success", userLanguage),
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: getLocalizedMessage("upload.invalid_file", userLanguage),
			},
			400,
		);
	}
});

app.get("/songs", async (c) => {
	const userLanguage = c.get("userLanguage");

	try {
		const songs = await getSongsFromDatabase();

		return c.json({
			success: true,
			data: songs,
			message:
				songs.length === 0
					? getLocalizedMessage("songs.empty", userLanguage)
					: undefined,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: getLocalizedMessage("server.internal_error", userLanguage),
			},
			500,
		);
	}
});

export default app;
```

### Email Template Localization

```typescript
// api/src/services/emailService.ts
import type { SupportedLanguage } from "@/shared/types";

interface EmailTemplate {
	subject: string;
	body: string;
}

const emailTemplates: Record<
	SupportedLanguage,
	Record<string, EmailTemplate>
> = {
	en: {
		welcome: {
			subject: "Welcome to SongShare",
			body: "Thank you for joining SongShare! Start sharing your music today.",
		},
		password_reset: {
			subject: "Reset Your Password",
			body: "Click the link below to reset your password:",
		},
	},
	es: {
		welcome: {
			subject: "Bienvenido a SongShare",
			body: "¡Gracias por unirte a SongShare! Comienza a compartir tu música hoy.",
		},
		password_reset: {
			subject: "Restablecer Tu Contraseña",
			body: "Haz clic en el enlace de abajo para restablecer tu contraseña:",
		},
	},
	zh: {
		welcome: {
			subject: "欢迎来到 SongShare",
			body: "感谢您加入 SongShare！今天就开始分享您的音乐吧。",
		},
		password_reset: {
			subject: "重置您的密码",
			body: "点击下面的链接重置您的密码：",
		},
	},
};

export function getEmailTemplate(
	templateKey: string,
	language: SupportedLanguage,
): EmailTemplate {
	return (
		emailTemplates[language][templateKey] || emailTemplates.en[templateKey]
	);
}
```

## Client-Server Language Synchronization

### Why Cookies Are Essential for API Communication

**Automatic Transmission**: Cookies are sent with every HTTP request without additional client-side code
**Server-Side Availability**: API can immediately know user's language preference  
**Consistent Experience**: Same language across React UI and API responses
**Performance**: No need for additional API calls to determine language

### Complete Flow Example

```typescript
// 1. User switches language in React app
const handleLanguageSwitch = async (newLang: SupportedLanguage) => {
	// Save to cookie (available to server) and localStorage (client backup)
	saveLanguagePreference(newLang);

	// Navigate to new language URL
	navigate(`/${newLang}${currentPath}`);

	// Change React app language
	await i18n.changeLanguage(newLang);
};

// 2. Next API request automatically includes cookie
const uploadSong = async (formData: FormData) => {
	// Cookie 'preferred-language=es' is automatically sent
	const response = await fetch("/api/songs/upload", {
		method: "POST",
		body: formData,
		// No need to manually add language header - cookie handles it!
	});

	const result = await response.json();
	// result.message is already in Spanish from server
	return result;
};

// 3. Server receives request with language cookie
app.post("/songs/upload", async (c) => {
	const userLanguage = c.get("userLanguage"); // 'es' from cookie

	// All responses are automatically in user's preferred language
	return c.json({
		message: getLocalizedMessage("upload.success", userLanguage), // "Archivo subido exitosamente"
	});
});
```

### Benefits of Cookie-Based Approach

- ✅ **No client-side language header management needed**
- ✅ **Server always knows user's preference**
- ✅ **Works for all API calls** (fetch, form submissions, etc.)
- ✅ **Consistent language across SSR and client-side rendering**
- ✅ **Persists across browser sessions**
- ✅ **Available in middleware for request preprocessing**

### API Error Handling with Localized Messages

```typescript
// Client-side error handling gets localized messages automatically
const handleFormSubmit = async (data: FormData) => {
	try {
		const response = await fetch("/api/songs", {
			method: "POST",
			body: data,
		});

		const result = await response.json();

		if (!result.success) {
			// Error message is already in user's language from server
			toast.error(result.error); // "El archivo es demasiado grande" (if Spanish user)
			return;
		}

		// Success message is also localized
		toast.success(result.message); // "Archivo subido exitosamente"
	} catch (error) {
		// Fallback to client-side localized message
		toast.error(t("errors.network"));
	}
};
```

## Best Practices for Language Switching

#### 1. **Immediate Feedback**

```typescript
// Show loading state during language switch
const switchLanguage = async (newLang: SupportedLanguage) => {
	setIsLoading(true); // Optional: show loading spinner

	try {
		saveLanguagePreference(newLang);
		navigate(`/${newLang}${currentPath}`);
		await i18n.changeLanguage(newLang); // Suspense handles this
	} finally {
		setIsLoading(false);
	}
};
```

#### 2. **Preserve User Context**

```typescript
// Maintain current page when switching languages
const currentPath = location.pathname.substring(3) || "/";
navigate(`/${newLang}${currentPath}`);

// Examples:
// /en/songs → /es/songs (stays on songs page)
// /zh/about → /en/about (stays on about page)
```

#### 3. **Accessibility Considerations**

```typescript
// Announce language changes to screen readers
const announceLanguageChange = (newLang: SupportedLanguage) => {
	const announcement = `Language changed to ${LANGUAGE_OPTIONS.find((opt) => opt.code === newLang)?.name}`;

	// Create temporary announcement element
	const announcer = document.createElement("div");
	announcer.setAttribute("aria-live", "polite");
	announcer.setAttribute("aria-atomic", "true");
	announcer.className = "sr-only"; // Screen reader only
	announcer.textContent = announcement;

	document.body.appendChild(announcer);
	setTimeout(() => document.body.removeChild(announcer), 1000);
};
```

#### 4. **Performance Optimization**

```typescript
// Preload other language resources for faster switching
useEffect(() => {
	// Preload other languages after initial load
	const preloadLanguages = SUPPORTED_LANGUAGES.filter(
		(lang) => lang !== currentLanguage,
	);

	preloadLanguages.forEach((lang) => {
		// This will cache the resources without changing the UI
		void i18n.loadLanguages([lang]);
	});
}, [currentLanguage, i18n]);
```

## SEO Considerations

### HTML Lang Attribute

```typescript
useEffect(() => {
	document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

### Meta Tags

```typescript
<Helmet>
  <html lang={i18n.language} />
  <meta property="og:locale" content={getLocaleCode(i18n.language)} />
</Helmet>
```

## Development Workflow

### Adding New Languages

1. Add language code to `SUPPORTED_LANGUAGES` array
2. Create new translation file in `resources/`
3. Update type definitions if using TypeScript
4. Test language detection and routing

### Adding New Translations

1. Add keys to all language files
2. Use consistent nested structure
3. Consider context and pluralization
4. Test with actual content length

### Testing

#### Development (Vite Dev Server)

```bash
# Test client-side redirect behavior
curl -I http://localhost:5173/
# Expected: Returns index.html (SPA), redirect happens client-side

# Test SPA routing
curl -I http://localhost:5173/en/
# Expected: Returns index.html, React Router handles routing
```

#### Production (Cloudflare Pages)

```bash
# Test root redirect with Pages Functions
curl -I -H "Accept-Language: es,en;q=0.9" https://your-app.pages.dev/
# Expected: HTTP/1.1 302 Found, Location: /es/

# Test static redirect fallback
curl -I https://your-app.pages.dev/
# Expected: HTTP/1.1 302 Found, Location: /en/

# Test language-specific paths
curl -I https://your-app.pages.dev/es/
# Expected: HTTP/1.1 200 OK, returns index.html
```

#### Local Testing with Pages Functions

```bash
# Install Wrangler CLI
npm install -g wrangler

# Test Pages Functions locally
wrangler pages dev dist --compatibility-date=2023-05-18
```

## Critical Implementation Rules

### Root Path Behavior

The root path (`/`) **MUST NEVER** serve content directly:

```typescript
// ❌ WRONG - This would serve content at root
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Never do this!
  }
]);

// ✅ CORRECT - Root only redirects
const router = createBrowserRouter([
  {
    path: "/",
    element: <LanguageDetector />, // Always redirects
  },
  {
    path: "/:lang",
    element: <LanguageProvider />,
    children: [
      { path: "", element: <Layout /> }, // Content served here
    ],
  },
]);
```

### Deployment Configuration

#### Pages Functions Setup

Ensure your `wrangler.toml` includes Pages Functions configuration:

```toml
[build]
command = "npm run build"
publish = "dist"

# Pages Functions are automatically detected from /functions directory
compatibility_date = "2023-05-18"
```

#### Directory Structure Requirements

```
/functions/
└── _middleware.ts    # Must be named _middleware.ts with underscore prefix
```

The `_middleware.ts` file runs for **all requests** before serving static assets, allowing us to intercept the root path and perform language detection.

## SPA Deployment Architecture

### Cloudflare Pages Setup

```
Project Structure:
├── dist/                    # Built SPA files
│   ├── index.html          # Main SPA entry point
│   └── assets/             # JS, CSS bundles
├── functions/              # Pages Functions (our implementation)
│   └── _middleware.ts      # Language detection middleware
└── api/                    # Separate API deployment
    └── (Cloudflare Workers)
```

### Our Implementation: Pages Functions Middleware

We chose **Pages Functions** with `_middleware.ts` for the following benefits:

✅ **Dynamic language detection** - Users land on their preferred language immediately
✅ **Proper HTTP 302 redirects** - Great for SEO and user experience  
✅ **Edge performance** - Runs at Cloudflare edge locations worldwide
✅ **Simple maintenance** - One file, automatic deployment
✅ **Fallback handling** - Graceful handling of unsupported languages

**Why not the alternatives:**

- ❌ Static redirects: Always go to English first, poor UX for non-English users
- ❌ Client-only: SEO issues, flash of content, requires JavaScript to load first

## Performance Considerations

- Translation resources are bundled with the app (no lazy loading)
- Language detection runs only on root URL access
- Route changes within the same language don't trigger re-detection
- i18n context is provided at the language route level to minimize re-renders
- Pages Functions add minimal latency for language detection
- Static redirects have no performance overhead

## Suspense Integration Patterns

### 1. **Translation Loading with Suspense**

React i18next supports Suspense for handling translation loading states elegantly:

```typescript
// react/src/hooks/useLanguage.ts - Suspense-aware hook
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { SupportedLanguage } from "@/react/i18n/types";

function useLanguage() {
	// This hook can suspend if translations aren't loaded
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const switchLanguage = useCallback(
		async (newLang: SupportedLanguage) => {
			const currentPath = location.pathname.substring(3); // Remove /xx/
			navigate(`/${newLang}${currentPath}`);

			// This may suspend if new language isn't loaded
			await i18n.changeLanguage(newLang);
		},
		[i18n, navigate, location],
	);

	return {
		currentLanguage: i18n.language as SupportedLanguage,
		switchLanguage,
		// No need for isLanguageLoading - Suspense handles this
	};
}

export default useLanguage;
```

### 2. **Nested Suspense Boundaries**

For better UX, you can have multiple Suspense boundaries:

```typescript
// react/src/App.tsx - Multiple Suspense levels
function App(): ReactElement {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AppLoadingFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Global app loading
function AppLoadingFallback(): ReactElement {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🎵 SongShare Effect</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading application...</p>
      </div>
    </div>
  );
}

// Individual page suspense boundaries
function SongsPage(): ReactElement {
  return (
    <Suspense fallback={<PageLoadingFallback message="Loading songs..." />}>
      <SongsContent />
    </Suspense>
  );
}

function SongsContent(): ReactElement {
  const { t } = useTranslation(); // Can suspend for translations

  return (
    <div>
      <h1>{t('pages.songs.title')}</h1>
      {/* Rest of component */}
    </div>
  );
}
```

### 3. **Error Boundaries for Translation Failures**

```typescript
// react/src/components/TranslationErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class TranslationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Translation loading error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2>Translation Error</h2>
          <p>Failed to load translations. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TranslationErrorBoundary;
```

## Modern i18n Best Practices

### 1. **Type Safety** ✅

- **Translation key validation** at compile time
- **Resource structure types** prevent runtime errors
- **Language code validation** with const assertions
- **Hook return types** for better IDE support

### 2. **Suspense Integration** ✅

- **Automatic loading states** with React Suspense
- **No manual loading flags** needed in components
- **Nested boundaries** for granular loading UX
- **Error boundaries** for translation failures

### 2. **Performance Optimization** ✅

- **Server-side language detection** reduces client-side JavaScript
- **Bundle splitting** by language (future enhancement)
- **Lazy loading** of translation resources (future enhancement)
- **Tree shaking** unused translations in production builds

### 3. **SEO & Accessibility** ✅

- **Proper HTTP redirects** (302) for language detection
- **HTML lang attribute** updates automatically
- **ARIA labels** for language switcher
- **Hreflang meta tags** (future enhancement)

### 4. **Developer Experience** ✅

- **ESLint integration** prevents common i18n errors
- **TypeScript autocompletion** for translation keys
- **Consistent file organization** across the monorepo
- **Clear separation** between client and server language handling

### 5. **Production Readiness** ✅

- **Edge-based language detection** with Cloudflare Pages Functions
- **Fallback mechanisms** for unsupported languages
- **Clean URLs** with language prefixes
- **No client-side flash** of wrong language content

## Integration with Project Architecture

### TypeScript Configuration

```typescript
// Included in tsconfig.app.json for React components
"include": ["react/src", "shared"],
"types": ["vite/client", "@types/react-i18next"]

// Included in tsconfig.functions.json for middleware
"include": ["functions/**/*"],
"types": ["@cloudflare/workers-types"]
```

### ESLint Rules

```javascript
// Custom rules for i18n in eslint.config.js
"rules": {
  "react-hooks/exhaustive-deps": ["warn", {
    "additionalHooks": "(useTranslation)"
  }],
  // Prevent importing i18n in server environments
  "no-restricted-imports": ["error", {
    "patterns": [{
      "group": ["react-i18next"],
      "message": "react-i18next should not be used in server environments"
    }]
  }]
}
```

### Shared Constants

```typescript
// Can be imported in both client and server code
import type { SupportedLanguage } from "@/shared/types";

// In shared/types/index.ts for cross-project use
export const SUPPORTED_LANGUAGES = ["en", "es", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
```

## Step-by-Step Migration Guide

### Phase 1: Dependencies and Configuration

1. **Install Dependencies**:

   ```bash
   npm install react-i18next@^15.0.0 i18next@^23.15.0
   npm install -D @types/react-i18next
   ```

2. **Create TypeScript Configuration** (already configured in your project):
   - `tsconfig.functions.json` includes Cloudflare Workers types
   - `tsconfig.app.json` includes React and DOM types
   - ESLint rules configured for both environments

### Phase 2: Core Implementation Files

3. **Create Language Detection Middleware**:

   ```bash
   mkdir -p functions
   # Create functions/_middleware.ts (see implementation above)
   ```

4. **Create i18n Configuration**:

   ```bash
   mkdir -p react/src/i18n/resources
   # Create react/src/i18n/types.ts
   # Create react/src/i18n/index.ts
   # Create translation JSON files
   ```

5. **Create React Components**:
   ```bash
   # Create react/src/components/LanguageDetector.tsx
   # Create react/src/components/LanguageProvider.tsx
   # Create react/src/components/LanguageSwitcher.tsx
   # Create react/src/hooks/useLanguage.ts
   ```

### Phase 3: Router Migration

6. **Update App.tsx Router Structure**:

   **CRITICAL CHANGES**:
   - Move all existing routes under `/:lang` parent route
   - Add `LanguageDetector` for root path `/`
   - Add `LanguageProvider` for `/:lang` path
   - Wrap `LanguageProvider` in `Suspense`

   ```typescript
   // BEFORE: Simple flat routes
   const router = createBrowserRouter([
     {
       path: "/",
       element: <Layout />,
       children: [
         { index: true, element: <HomePage /> },
         { path: "songs", element: <SongsPage /> },
         // ... other routes
       ],
     },
   ]);

   // AFTER: Language-nested routes with Suspense
   const router = createBrowserRouter([
     {
       path: "/",
       element: <LanguageDetector />, // NEW: Redirects to /:lang
     },
     {
       path: "/:lang", // NEW: Language parameter
       element: <LanguageProvider />, // NEW: Includes Suspense internally
       children: [
         {
           path: "",
           element: <Layout />, // MOVED: Under language route
           children: [
             { index: true, element: <HomePage /> }, // SAME: But now at /:lang/
             { path: "songs", element: <SongsPage /> }, // SAME: But now at /:lang/songs
             // ... other routes (all moved under /:lang)
           ],
         },
       ],
     },
   ]);
   ```

   **Key Suspense Benefits**:
   - **Automatic loading states** when switching languages
   - **No manual loading flags** in components
   - **Seamless UX** during translation loading
   - **Error boundaries** can catch translation failures

   ```

   ```

### Phase 4: Navigation Updates

7. **Update Navigation Component**:
   - Replace hardcoded labels with translation keys
   - Add language prefix to all Link `to` props
   - Import and use `useTranslation` hook

   ```typescript
   // BEFORE: Static links
   <Link to="/songs">Songs</Link>

   // AFTER: Dynamic language-aware links
   const { t, i18n } = useTranslation();
   const currentLang = i18n.language as SupportedLanguage;
   <Link to={`/${currentLang}/songs`}>{t('navigation.songs')}</Link>
   ```

### Phase 5: Content Translation

8. **Create Translation Files**:

   ```bash
   # react/src/i18n/resources/en.json - Base language
   # react/src/i18n/resources/es.json - Spanish
   # react/src/i18n/resources/zh.json - Chinese
   ```

9. **Update Page Components**:

   ```typescript
   // BEFORE: Hardcoded text
   function HomePage() {
     return <h1>Welcome to SongShare</h1>;
   }

   // AFTER: Translated text
   function HomePage(): ReactElement {
     const { t } = useTranslation();
     return <h1>{t('pages.home.title')}</h1>;
   }
   ```

### Phase 6: Link Updates Throughout App

10. **Update All Internal Links**:

    **Find and Replace Pattern**:

    ```bash
    # Find all Link components that need updating
    grep -r "to=\"/" react/src/ --include="*.tsx" --include="*.ts"
    ```

    **Common Patterns to Update**:

    ```typescript
    // Navigation links
    <Link to="/songs"> → <Link to={`/${currentLang}/songs`}>

    // Programmatic navigation
    navigate('/songs') → navigate(`/${currentLang}/songs`)

    // Form actions and redirects
    action="/upload" → action={`/${currentLang}/upload`}
    ```

### Phase 7: Testing and Validation

11. **Test Language Detection**:

    ```bash
    # Test server-side detection (after deployment)
    curl -H "Accept-Language: es" https://yourapp.pages.dev/

    # Test client-side fallback
    curl http://localhost:5173/
    ```

12. **Validate All Routes**:
    ```bash
    # Test each language path
    curl http://localhost:5173/en/
    curl http://localhost:5173/es/
    curl http://localhost:5173/zh/
    curl http://localhost:5173/en/songs
    curl http://localhost:5173/es/songs
    ```

### Phase 8: Deployment

13. **Deploy Functions and App**:
    ```bash
    # Build and deploy (existing commands work)
    npm run build:all
    npm run deploy:api  # If needed
    wrangler pages deploy dist  # Includes functions automatically
    ```

## Migration Checklist

- [ ] **Dependencies installed** (react-i18next, i18next)
- [ ] **TypeScript types configured** (types.ts, module augmentation)
- [ ] **Middleware created** (functions/\_middleware.ts)
- [ ] **i18n configuration** (react/src/i18n/index.ts with `useSuspense: true`)
- [ ] **Components created** (LanguageDetector, LanguageProvider with Suspense, LanguageSwitcher)
- [ ] **Router updated** (App.tsx with /:lang structure)
- [ ] **Suspense boundaries configured** (LanguageProvider includes Suspense)
- [ ] **Navigation updated** (language-aware links and translations)
- [ ] **Translation files created** (en.json, es.json, zh.json)
- [ ] **All Link components updated** (include language prefix)
- [ ] **All programmatic navigation updated** (useNavigate calls)
- [ ] **HTML lang attribute handling** (in LanguageProvider)
- [ ] **Error boundaries added** (TranslationErrorBoundary for translation failures)
- [ ] **Loading states removed** (replaced with Suspense boundaries)
- [ ] **Testing completed** (manual and automated tests including Suspense scenarios)
- [ ] **Deployment validated** (server-side detection working)

## Common Pitfalls to Avoid

❌ **Forgetting language prefix in Links**: Results in losing language context  
❌ **Not updating programmatic navigation**: `navigate('/songs')` should be `navigate(\`/${currentLang}/songs\`)`  
❌ **Missing Suspense wrapper**: Can cause hydration issues  
❌ **Hardcoded text in components**: Won't be translated  
❌ **Not handling invalid language codes**: Should redirect to default language  
❌ **Missing HTML lang attribute updates**: Poor accessibility and SEO

## Troubleshooting

### Common Issues

1. **Missing language prefix in navigation**: Ensure all `Link` components include the current language
2. **Language not persisting**: Check that the language parameter is properly extracted from URL
3. **Translation keys not found**: Verify key paths and ensure they exist in all language files
4. **Redirect loops**: Check language validation logic in `LanguageProvider`

### Debug Tools

```typescript
// Add to development builds
if (process.env.NODE_ENV === "development") {
	window.i18n = i18n; // Access i18n in browser console
}
```

## Cookie Implementation Requirements

### Shared Utilities for Cookie Management

Since cookies are essential for server API communication, add these utilities to your shared code:

```typescript
// shared/utils/languageStorage.ts
import type { SupportedLanguage } from "@/shared/types";
import { SUPPORTED_LANGUAGES } from "@/shared/types";

export const LANGUAGE_COOKIE_NAME = "preferred-language";
export const LANGUAGE_STORAGE_KEY = "preferred-language";

/**
 * Get stored language preference from cookie (universal) or localStorage (client-only)
 * Prioritizes cookie since it's available to both client and server
 */
export const getStoredLanguage = (): SupportedLanguage | null => {
	// Try cookie first (works on both client and server)
	if (typeof document !== "undefined") {
		const cookieMatch = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
		if (cookieMatch) {
			const lang = cookieMatch.split("=")[1];
			return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
				? (lang as SupportedLanguage)
				: null;
		}
	}

	// Fallback to localStorage (client only)
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
		return SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)
			? (stored as SupportedLanguage)
			: null;
	}

	return null;
};

/**
 * Save language preference to both cookie and localStorage
 * Cookie is required for server API communication
 */
export const setStoredLanguage = (language: SupportedLanguage): void => {
	// Set cookie with proper security flags (REQUIRED for API communication)
	if (typeof document !== "undefined") {
		const expires = new Date();
		expires.setDate(expires.getDate() + 365); // 1 year expiration
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
	}

	// Set localStorage as backup (faster client access)
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
		} catch (error) {
			console.warn("Failed to save language to localStorage:", error);
		}
	}
};

/**
 * Server-side cookie parsing utility for Pages Functions and API routes
 */
export const parseLanguageCookie = (
	cookieHeader: string | null,
): SupportedLanguage | null => {
	if (!cookieHeader) return null;

	const match = cookieHeader
		.split(";")
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(`${LANGUAGE_COOKIE_NAME}=`));

	if (match) {
		const lang = match.split("=")[1];
		return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
			? (lang as SupportedLanguage)
			: null;
	}

	return null;
};
```

### API Middleware Integration

```typescript
// api/src/middleware/language.ts
import { Context, Next } from "hono";

import type { SupportedLanguage } from "@/shared/types";
import { detectBrowserLanguage, parseLanguageCookie } from "@/shared/utils";

/**
 * Detect user's preferred language from request
 * Priority: Cookie > Accept-Language header > default (en)
 */
export function detectRequestLanguage(c: Context): SupportedLanguage {
	// 1. Check cookie first (user's explicit preference)
	const cookieHeader = c.req.header("Cookie");
	const cookieLang = parseLanguageCookie(cookieHeader);
	if (cookieLang) return cookieLang;

	// 2. Fall back to browser language detection
	const acceptLanguage = c.req.header("Accept-Language") || "";
	return detectBrowserLanguage(acceptLanguage);
}

/**
 * Middleware to add user's language to request context
 * Use this in all API routes that need localized responses
 */
export const languageMiddleware = async (c: Context, next: Next) => {
	const userLanguage = detectRequestLanguage(c);
	c.set("userLanguage", userLanguage);

	// Optional: Log language detection for debugging
	if (process.env.NODE_ENV === "development") {
		console.log(`Request language detected: ${userLanguage}`);
	}

	await next();
};
```

### Critical Implementation Notes

**1. Cookie Security**

- Use `SameSite=Lax` to balance security with functionality
- Include `Secure` flag for HTTPS environments
- Set reasonable expiration (1 year recommended)

**2. Fallback Strategy**

- Cookie → localStorage → Accept-Language → default (en)
- Always have a working fallback chain

**3. Server-Side Requirements**

- Cookies MUST be set by the client for API communication to work
- Server reads cookies automatically from request headers
- No additional client code needed once cookie is set

**4. Performance Considerations**

- Cookies are sent with every request (keep language cookie small)
- Cache language detection results where possible
- Use middleware to avoid repeating detection logic

**5. Testing Cookie Functionality**

```bash
# Test cookie is set correctly
curl -v http://localhost:5173/ -H "Accept-Language: es"
# Should see: Set-Cookie: preferred-language=es

# Test API receives cookie
curl -v http://localhost:8787/api/songs -H "Cookie: preferred-language=es"
# API should respond with Spanish error messages
```

This cookie-based approach ensures seamless language synchronization between your React frontend and Hono API server, providing users with a consistent localized experience across all interactions.

## GDPR and Privacy Compliance

### Language Preference Cookies Are Generally Permitted

The `preferred-language` cookie we implement falls under **"strictly necessary" or "functional" cookies** that are typically allowed without explicit consent under GDPR and similar regulations:

#### Legal Basis for Language Preference Cookies

**✅ GDPR Article 6(1)(f) - Legitimate Interest**

- Providing content in user's preferred language is a legitimate business interest
- User clearly benefits from personalized language experience
- No overriding privacy concerns with storing a language code

**✅ Recital 30 - Natural Persons May Be Associated**

- Language preference is not personal data under GDPR definition
- ISO language codes (en, es, zh) don't identify individuals
- No sensitive or identifying information stored

**✅ ePrivacy Directive Exception**

- "Strictly necessary for the provision of the service explicitly requested"
- Language localization is part of the core service functionality
- Required for proper website operation and user experience

### Privacy-First Implementation

```typescript
// shared/utils/languageStorage.ts - Privacy compliant implementation
export const LANGUAGE_COOKIE_NAME = "preferred-language";

export const setStoredLanguage = (language: SupportedLanguage): void => {
	if (typeof document !== "undefined") {
		const expires = new Date();
		expires.setDate(expires.getDate() + 365); // 1 year - reasonable retention

		// Privacy-compliant cookie attributes
		const secure = location.protocol === "https:" ? "; Secure" : "";
		const cookieString = [
			`${LANGUAGE_COOKIE_NAME}=${language}`,
			`expires=${expires.toUTCString()}`,
			"path=/",
			"SameSite=Lax", // Prevents CSRF while allowing functionality
			secure, // HTTPS only in production
			// Note: No HttpOnly flag - needs to be readable by client JS
		].join("; ");

		document.cookie = cookieString;
	}
};
```

### Best Practices for Compliance

#### 1. **Transparent Data Use**

```typescript
// Add to your privacy policy or cookie notice
const COOKIE_NOTICE = {
	en: {
		title: "Language Preference",
		description:
			"We store your language preference to display content in your chosen language.",
		purpose: "Website functionality",
		retention: "1 year",
		legal_basis: "Legitimate interest",
	},
	es: {
		title: "Preferencia de Idioma",
		description:
			"Almacenamos tu preferencia de idioma para mostrar contenido en tu idioma elegido.",
		purpose: "Funcionalidad del sitio web",
		retention: "1 año",
		legal_basis: "Interés legítimo",
	},
	zh: {
		title: "语言偏好",
		description: "我们存储您的语言偏好，以您选择的语言显示内容。",
		purpose: "网站功能",
		retention: "1年",
		legal_basis: "合法利益",
	},
};
```

#### 2. **User Control and Transparency**

```typescript
// Add language preference management to user settings
const LanguageSettings = () => {
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage();

  const clearLanguagePreference = () => {
    // Clear both cookie and localStorage
    document.cookie = `${LANGUAGE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);

    // Reset to browser default
    const browserLang = detectBrowserLanguage(navigator.language);
    navigate(`/${browserLang}/`);
  };

  return (
    <div className="language-settings">
      <h3>{t('settings.language.title')}</h3>
      <p>{t('settings.language.description')}</p>

      <LanguageSwitcher />

      <button onClick={clearLanguagePreference} className="link-button">
        {t('settings.language.reset')}
      </button>

      <details className="privacy-details">
        <summary>{t('settings.language.privacy_info')}</summary>
        <p>{t('settings.language.cookie_explanation')}</p>
        <ul>
          <li>{t('settings.language.data_stored')}: {currentLang}</li>
          <li>{t('settings.language.retention')}: 1 {t('year')}</li>
          <li>{t('settings.language.purpose')}: {t('settings.language.functionality')}</li>
        </ul>
      </details>
    </div>
  );
};
```

#### 3. **Data Minimization**

```typescript
// Only store what's necessary - just the language code
// ✅ Good: "es"
// ❌ Avoid: { language: "es", country: "ES", timezone: "Europe/Madrid", timestamp: "..." }

export const setStoredLanguage = (language: SupportedLanguage): void => {
	// Store only the minimal required data
	const cookieValue = language; // Just "en", "es", or "zh"

	// Set reasonable expiration (not indefinite)
	const expires = new Date();
	expires.setDate(expires.getDate() + 365); // 1 year max

	document.cookie = `${LANGUAGE_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};
```

### Regional Compliance Considerations

#### **EU/UK (GDPR/UK GDPR)**

- ✅ Language preference cookies typically don't require consent
- ✅ Must be documented in privacy policy
- ✅ Users must have option to delete/modify

#### **California (CCPA)**

- ✅ Language codes are not "personal information" under CCPA
- ✅ No sale/sharing restrictions apply
- ✅ Standard privacy policy disclosure sufficient

#### **Canada (PIPEDA)**

- ✅ Language preference falls under "implied consent"
- ✅ Clear business purpose (website functionality)
- ✅ Minimal privacy impact

### Cookie Notice Example (Optional but Recommended)

Since language cookies are functional, you may still want to inform users:

```typescript
// Optional: Brief, non-intrusive notice
const FunctionalCookieNotice = () => {
  const { t } = useTranslation();

  return (
    <div className="cookie-notice functional">
      <p>
        {t('cookies.functional_notice')}
        <Link to="/privacy">{t('cookies.learn_more')}</Link>
      </p>
    </div>
  );
};

// Translation keys
const cookieTranslations = {
  en: {
    'cookies.functional_notice': 'We use a cookie to remember your language preference.',
    'cookies.learn_more': 'Learn more'
  },
  es: {
    'cookies.functional_notice': 'Usamos una cookie para recordar tu preferencia de idioma.',
    'cookies.learn_more': 'Más información'
  },
  zh: {
    'cookies.functional_notice': '我们使用 cookie 来记住您的语言偏好。',
    'cookies.learn_more': '了解更多'
  }
};
```

### Summary: Why Language Cookies Are Compliant

1. **🎯 Functional Purpose**: Essential for website operation
2. **🔒 Non-Personal Data**: Language codes don't identify individuals
3. **⚖️ Legitimate Interest**: Clear business justification
4. **🕒 Reasonable Retention**: 1 year maximum, user-controllable
5. **🔍 Transparent**: Purpose clearly communicated to users
6. **🗑️ User Control**: Easy to delete/modify preference

The language preference cookie is one of the most privacy-friendly cookies you can implement, as it enhances user experience without collecting personal data or tracking behavior.

---

## Summary

This comprehensive guide provides everything needed to implement internationalization in the SongShare Effect application. The system uses modern React patterns with Suspense, server-side language detection via Cloudflare Pages Functions, and type-safe translation management.

### Key Benefits

✅ **Production-Ready**: Complete implementation with error handling and fallbacks  
✅ **Type-Safe**: Full TypeScript support with translation key validation  
✅ **Performance Optimized**: Server-side detection, Suspense integration, edge deployment  
✅ **SEO Friendly**: Proper HTTP redirects and language-specific URLs  
✅ **User-Centric**: Cookie persistence, smooth language switching, accessibility support  
✅ **Developer Experience**: Clear separation of concerns, comprehensive testing, detailed troubleshooting

The "Quick Start (AI Agent Guide)" section provides step-by-step implementation commands that can be executed directly to set up the complete internationalization system.
