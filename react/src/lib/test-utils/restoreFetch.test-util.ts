/**
 * Restore the global `fetch` platform API after a test stub has replaced it.
 *
 * This is a common pattern across many tests that temporarily call
 * `vi.stubGlobal("fetch", ...)`. By centralizing the logic here we avoid
 * duplicating the `Reflect.set` call and keep the intent obvious in each test
 * file.
 */
// oxlint-disable-next-line eslint/prefer-default-export -- small helper keeps import form consistent
export function restoreFetch(originalFetch: unknown): void {
	Reflect.set(globalThis, "fetch", originalFetch);
}
