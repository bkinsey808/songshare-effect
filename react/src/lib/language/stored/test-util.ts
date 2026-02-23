/**
 * Value representing an absent language in `localStorage`.
 *
 * The linter normally disallows `null` literals in source code, so we centralize
 * the disable comment here and export a constant for tests to consume.  This keeps
 * the tests themselves free of disables while still allowing us to simulate the
 * `string | null` return type of `Storage.getItem`.
 */
// oxlint-disable-next-line import/prefer-default-export, unicorn/no-null
export const missingLanguage: string | null = null;
