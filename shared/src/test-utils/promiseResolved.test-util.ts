/**
 * Test helper that returns a resolved Promise without triggering
 * promise/prefer-await-to-then when used in sync-looking stub bodies.
 */
export default function promiseResolved<TValue>(value: TValue): Promise<TValue> {
	/* oxlint-disable-next-line promise/prefer-await-to-then -- stub returns resolved value; await not possible in sync chain */
	return Promise.resolve(value);
}

/**
 * Test helper that returns a rejected Promise for stub bodies.
 */
export function promiseRejected<TNever = never>(reason: unknown): Promise<TNever> {
	/* oxlint-disable-next-line promise/prefer-await-to-then, promise/prefer-promise-reject-errors -- stub returns rejected value; reason may be non-Error */
	return Promise.reject(reason);
}
