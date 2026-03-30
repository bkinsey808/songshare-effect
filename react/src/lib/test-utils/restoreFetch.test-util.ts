/**
 * Restore the global `fetch` platform API after a test stub has replaced it.
 *
 * This is a common pattern across many tests that temporarily call
 * `vi.stubGlobal("fetch", ...)`. By centralizing the logic here we avoid
 * duplicating the `Reflect.set` call and keep the intent obvious in each test
 * file.
 *
 * @param originalFetch - Original global fetch implementation captured by the test.
 * @returns void
 */
function restoreFetch(originalFetch: unknown): void {
	Reflect.set(globalThis, "fetch", originalFetch);
}

export { restoreFetch };
export default restoreFetch;
