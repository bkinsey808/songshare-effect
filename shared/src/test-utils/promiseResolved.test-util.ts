/**
 * Test helper that returns a resolved Promise without triggering
 * promise/prefer-await-to-then when used in sync-looking stub bodies.
 *
 * @param value - Value to resolve with
 * @returns A promise that resolves to the value
 */
export default function promiseResolved<TValue>(value: TValue): Promise<TValue> {
	/* oxlint-disable-next-line promise/prefer-await-to-then -- stub returns resolved value; await not possible in sync chain */
	return Promise.resolve(value);
}

/**
 * Test helper that returns a rejected Promise for stub bodies.
 *
 * @param reason - Reason for rejection
 * @returns A promise that rejects with the reason
 */
export function promiseRejected<TNever = never>(reason: unknown): Promise<TNever> {
	/* oxlint-disable-next-line promise/prefer-await-to-then, promise/prefer-promise-reject-errors -- stub returns rejected value; reason may be non-Error */
	return Promise.reject(reason);
}
