/**
 * Create a delay promise
 *
 * @param ms - milliseconds to delay
 * @returns A Promise that resolves after the requested delay
 */
export default function delay(ms: number): Promise<void> {
	// oxlint-disable-next-line promise/avoid-new, unicorn/no-new-promises, no-new-promises
	return new Promise((resolve) => setTimeout(resolve, ms));
}
