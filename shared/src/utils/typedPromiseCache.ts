// Typed promise caches for storing Promise<T> and supporting Suspense patterns.
// Uses symbol-scoped keys so multiple caches don't collide when using the same string ids.

export type CacheKey<TValue> = Readonly<{
	id: symbol;
	hint?: string;
	__type?: TValue;
}>;

export function createCacheKeyFactory<TValue>(
	prefix?: string,
): (id: string) => CacheKey<TValue> {
	const map = new Map<string, symbol>();
	return (id: string): CacheKey<TValue> => {
		const hasPrefix = typeof prefix === "string" && prefix !== "";
		if (!map.has(id)) {
			const symbolName = hasPrefix ? `${prefix}:${id}` : id;
			map.set(id, Symbol(symbolName));
		}

		return { id: map.get(id)!, hint: hasPrefix ? `${prefix}:${id}` : id };
	};
}

export type TypedCache<TValue> = Readonly<{
	readonly key: (id: string) => CacheKey<TValue>;
	has(id: string): boolean;
	delete(id: string): boolean;
	clear(): void;
	get(id: string, fetcher: () => Promise<TValue>): Promise<TValue>;
}>;

export function createTypedCache<TValue>(prefix?: string): TypedCache<TValue> {
	const keyFactory: (id: string) => CacheKey<TValue> =
		createCacheKeyFactory<TValue>(prefix);
	const internal = new Map<symbol, Promise<TValue>>();

	return {
		key: keyFactory,
		has(id: string): boolean {
			const cacheKey = keyFactory(id);
			return internal.has(cacheKey.id);
		},
		delete(id: string): boolean {
			const cacheKey = keyFactory(id);
			return internal.delete(cacheKey.id);
		},
		clear(): void {
			internal.clear();
		},
		async get(id: string, fetcher: () => Promise<TValue>): Promise<TValue> {
			const cacheKey = keyFactory(id);
			if (!internal.has(cacheKey.id)) {
				const promise = fetcher().then(
					(result) => {
						internal.set(cacheKey.id, Promise.resolve(result));
						return result;
					},
					(err: unknown) => {
						internal.delete(cacheKey.id);
						if (err instanceof Error) {
							throw err;
						}
						throw new Error(String(err));
					},
				);
				internal.set(cacheKey.id, promise);
			}

			return internal.get(cacheKey.id)!;
		},
	} as const;
}

export type SuspenseCache<TValue> = Readonly<{
	key(id: string): CacheKey<TValue>;
	// getOrThrow: either returns a resolved TValue or throws a thenable Error
	// for Suspense while pending — it does NOT return a Promise.
	getOrThrow(id: string, fetcher: () => Promise<TValue>): TValue;
	has(id: string): boolean;
	delete(id: string): boolean;
	clear(): void;
}>;

export function createSuspenseCache<TValue>(
	prefix?: string,
): SuspenseCache<TValue> {
	const keyFactory = createCacheKeyFactory<TValue>(prefix);
	const internal = new Map<symbol, Promise<TValue> | TValue>();

	// A thenable `Error` wrapper — satisfies `only-throw-error` lint rule
	// while remaining thenable so React's Suspense (which checks for
	// thenables) still recognizes and awaits it.
	/* The thenable pattern is intentionally required so React Suspense will accept
		 thrown values. Keep just the specific rule disabled for this localized class. */
	/* oxlint-disable-next-line unicorn/no-thenable */
	class ThenableError<TValue> extends Error implements PromiseLike<TValue> {
		constructor(private readonly promise: Promise<TValue>) {
			super("SuspenseThenable");
			// Maintain prototype chain for instanceof checks
			Object.setPrototypeOf(this, new.target.prototype);
		}
		// (constructor finished) — then method follows

		// `then` must be available so React's Suspense (thenable detection)
		// recognizes this thrown object as suspendable. This method delegates
		// to the wrapped promise. We disable the `promise-function-async` rule
		// for this method because it needs to mirror PromiseLike semantics.
		// The method is intentionally non-async and mirrors PromiseLike.then
		// oxlint-disable-next-line promise-function-async, no-thenable
		public then<TResult1 = TValue, TResult2 = never>(
			onfulfilled?:
				| ((value: TValue) => TResult1 | PromiseLike<TResult1>)
				| null,
			onrejected?:
				| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
				| null,
		): Promise<TResult1 | TResult2> {
			// Delegate to the inner promise — forward callbacks without unsafe
			// casts. If there is no rejection handler, forward only the
			// fulfillment handler; otherwise wrap the rejection to ensure the
			// types line up safely.
			if (onrejected === undefined || onrejected === null) {
				return this.promise.then(onfulfilled);
			}

			return this.promise.then(onfulfilled, (reason: unknown) =>
				onrejected(reason),
			);
		}
	}

	return {
		key(id: string) {
			return keyFactory(id);
		},
		has(id: string) {
			const cacheKey = keyFactory(id);
			return internal.has(cacheKey.id);
		},
		delete(id: string) {
			const cacheKey = keyFactory(id);
			return internal.delete(cacheKey.id);
		},
		clear() {
			internal.clear();
		},
		getOrThrow(id: string, fetcher: () => Promise<TValue>) {
			const cacheKey = keyFactory(id);
			if (internal.has(cacheKey.id)) {
				const cached = internal.get(cacheKey.id)!;
				if (cached instanceof Promise) {
					// still pending — throw a thenable Error wrapper. React's
					// Suspense will treat thenables as suspendable; throwing an
					// Error subclass keeps the code compliant with lint rules.
					throw new ThenableError<TValue>(cached);
				}

				return cached as TValue;
			}

			const promise = fetcher().then(
				(result) => {
					internal.set(cacheKey.id, result);
					return result;
				},
				(err: unknown) => {
					internal.delete(cacheKey.id);
					// Ensure we always throw an Error instance
					if (err instanceof Error) {
						throw err;
					}
					throw new Error(String(err));
				},
			);

			internal.set(cacheKey.id, promise);
			// Throw a thenable Error wrapper (see above) so the thrown value
			// satisfies lint rules and remains usable by Suspense.
			throw new ThenableError<TValue>(promise);
		},
	} as const;
}
