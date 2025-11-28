export type RetryResult<TValue> = {
	readonly value?: TValue;
	readonly lastError?: unknown;
	readonly aborted: boolean;
	readonly succeeded: boolean;
};

const DEFAULT_DELAY_MS = 0;

export async function retryWithBackoff<TValue>(
	fn: () => Promise<TValue | undefined>,
	delays: readonly number[],
	options?: {
		shouldAbort?: (err: unknown) => boolean;
		onError?: (err: unknown, attempt: number) => void;
		defaultDelayMs?: number;
	},
): Promise<RetryResult<TValue>> {
	let lastErr: unknown = undefined;
	const shouldAbort = options?.shouldAbort;
	const onError = options?.onError;
	const defaultDelayMs = options?.defaultDelayMs ?? DEFAULT_DELAY_MS;

	for (const [attempt] of delays.entries()) {
		try {
			// awaiting inside the retry loop is intentional — retries are sequential
			// oxlint-disable-next-line no-await-in-loop
			const data = await fn();
			if (data !== undefined) {
				return {
					value: data,
					lastError: undefined,
					aborted: false,
					succeeded: true,
				};
			}
		} catch (err) {
			lastErr = err;
			onError?.(err, attempt);
			if (shouldAbort?.(err) ?? false) {
				// omit `value` when there is no successful value. With
				// exactOptionalPropertyTypes enabled we must not set value: undefined
				return { lastError: err, aborted: true, succeeded: false };
			}
		}

		const delay = delays[attempt] ?? defaultDelayMs;
		if (delay > DEFAULT_DELAY_MS) {
			// sequential backoff by design
			// oxlint-disable-next-line no-await-in-loop
			await new Promise<void>((resolve) => setTimeout(resolve, delay));
		}
	}

	// No value was produced; omit the `value` property to satisfy strict optional
	// property rules.
	return { lastError: lastErr, aborted: false, succeeded: false };
}
