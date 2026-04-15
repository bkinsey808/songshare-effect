/**
 * Test helper for an async no-op function that satisfies lint rules.
 *
 * @returns void
 */
export default async function asyncNoop(): Promise<void> {
	await Promise.resolve();
}
