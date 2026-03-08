---
name: internationalization
description: i18n patterns for this project — useLocale/useLanguage/useCurrentLang hooks, URL-based language routing, adding translation keys, SupportedLanguageType. Use when adding UI text, building localized links, or working with language switching.
compatibility: react-i18next 13.x, i18next 23.x, React Router 6.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Internationalization Skill

## Use When

Use this skill when:

- Adding/changing localized UI copy or language-aware routes/links.
- Editing language hooks, supported-language handling, or translation keys.

Execution workflow:

1. Use the appropriate language hook for context (`useLocale` default for UI).
2. Keep language in URL/path handling consistent with existing routing patterns.
3. Update translation keys across all supported language files.
4. Validate localized behavior with targeted tests/checks, then run `npm run lint`.

Output requirements:

- Summarize hook/key/path changes and impacted locales.
- Note any fallback or missing-translation behavior changes.

The project uses `react-i18next` with URL-path-based language routing. The active language lives in the URL — `/en/songs`, `/es/songs`, `/zh/songs`.

Supported languages are defined in `@/shared/language/supported-languages`:

```typescript
// Supported values: "en" | "es" | "zh"
import type { SupportedLanguageType } from "@/shared/language/supported-languages";
```

## Which Hook to Use

| Hook               | Returns       | Use when                                                                                            |
| ------------------ | ------------- | --------------------------------------------------------------------------------------------------- |
| `useLocale()`      | `{ lang, t }` | Component needs **both** language and translation function                                          |
| `useLanguage()`    | `lang`        | Component needs language only (e.g., building locale-aware URLs)                                    |
| `useCurrentLang()` | `lang`        | Need lang from URL pathname without component reactivity (or in tests with `{ pathname }` override) |

**Default: `useLocale()`** — it's the most ergonomic for UI components.

```typescript
import useLocale from "@/react/lib/language/locale/useLocale";

function MySongCard(): ReactElement {
  const { t, lang } = useLocale();
  return (
    <div>
      <p>{t("songs.by_artist")}</p>
      <a href={`/${lang}/songs`}>{t("nav.songs")}</a>
    </div>
  );
}
```

## Adding Translation Keys

Translations live in `react/src/translations/`:

```
react/src/translations/
├── en.json
├── es.json
└── zh.json
```

Add the key to **all three files**:

```json
// en.json
{ "songs": { "by_artist": "By Artist" } }

// es.json
{ "songs": { "by_artist": "Por Artista" } }

// zh.json
{ "songs": { "by_artist": "按艺术家" } }
```

Use dot notation in `t()`:

```typescript
t("songs.by_artist");
```

## Building Language-Aware Links

Always prefix routes with `/${lang}/` — never hardcode `/en/` or `/`:

```typescript
// ✅ GOOD
const { lang } = useLocale();
<Link to={`/${lang}/community/${communityId}`}>...</Link>

// ❌ BAD
<Link to={`/en/community/${communityId}`}>...</Link>
<Link to={`/community/${communityId}`}>...</Link>
```

To switch language while staying on the same page, use `getPathWithoutLang` from `@/react/lib/language/path/getPathWithoutLang`:

```typescript
import getPathWithoutLang from "@/react/lib/language/path/getPathWithoutLang";

const pathWithoutLang = getPathWithoutLang(location.pathname);
navigate(`/${newLang}${pathWithoutLang}`);
```

## Reading Language from a Path (Non-Component)

Use the pure utility `getCurrentLangFromPath` when you need the language outside a React component or in tests:

```typescript
import getCurrentLangFromPath from "@/react/lib/language/path/getCurrentLangFromPath";

const lang = getCurrentLangFromPath("/es/songs"); // → "es"
const lang = getCurrentLangFromPath("/zz/foo"); // → "en" (falls back to defaultLanguage)
```

## Language Provider

`LanguageProvider` from `@/react/lib/language/provider/LanguageProvider` is mounted near the root. It syncs the i18next runtime language with the URL. Do not call `i18n.changeLanguage()` directly — let the provider handle it.

## Do Not

- ❌ Hardcode UI strings — always use `t("key")`
- ❌ Build links without the language prefix
- ❌ Import `i18n` directly from `@/react/lib/language/i18n` in components — use `useLocale()` / `useTranslation()`
- ❌ Add keys to only one translation file — all three must be updated together

## References

- Supported languages: `@/shared/language/supported-languages`
- Full i18n documentation: [docs/internationalization-system.md](../../../docs/internationalization-system.md)
- React conventions: [../react-conventions/SKILL.md](../react-conventions/SKILL.md)

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If task is mostly UI component implementation, also load `react-conventions`.
- If refactor includes key/path naming decisions, also load `naming-conventions`.
