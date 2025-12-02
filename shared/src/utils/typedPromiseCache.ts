// Typed promise caches for storing Promise<T> and supporting Suspense patterns.
// Uses symbol-scoped keys so multiple caches don't collide when using the same string ids.

export type CacheKey<TValue> = Readonly<{
	id: symbol;
	hint?: string;
	__type?: TValue;
}>;

export function createCacheKeyFactory<TValue>(prefix?: string): (id: string) => CacheKey<TValue> {
	const map = new Map<string, symbol>();
	return (id: string): CacheKey<TValue> => {
		const hasPrefix = typeof prefix === "string" && prefix !== "";
		let sym = map.get(id);
		if (!sym) {
			const symbolName = hasPrefix ? `${prefix}:${id}` : id;
			sym = Symbol(symbolName);
			map.set(id, sym);
		}

		return { id: sym, hint: hasPrefix ? `${prefix}:${id}` : id };
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
	const keyFactory: (id: string) => CacheKey<TValue> = createCacheKeyFactory<TValue>(prefix);
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

			const existing = internal.get(cacheKey.id);
			if (existing) {
				return existing;
			}

			// Install the pending promise early, so concurrent callers share it.
			const pendingPromise = fetcher();
			internal.set(cacheKey.id, pendingPromise);

			try {
				const result = await pendingPromise;
				// store a resolved Promise for future callers
				// eslint-plugin-promise prefers await over then()/Promise.resolve in some contexts — disable here
				// oxlint-disable-next-line promise/prefer-await-to-then
				internal.set(cacheKey.id, Promise.resolve(result));
				return result;
			} catch (error: unknown) {
				internal.delete(cacheKey.id);
				if (error instanceof Error) {
					throw error;
				}
				// preserve cause for better diagnostics
				throw new Error(String(error), { cause: error });
			}
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

export function createSuspenseCache<TValue>(prefix?: string): SuspenseCache<TValue> {
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
		// oxlint-disable-next-line promise-function-async, no-thenable, promise/prefer-await-to-callbacks
		public then<TResult1 = TValue, TResult2 = never>(
			onfulfilled?: ((value: TValue) => TResult1 | PromiseLike<TResult1>) | null,
			onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
		): Promise<TResult1 | TResult2> {
			// Delegate to the inner promise — forward callbacks without unsafe
			// casts. If there is no rejection handler, forward only the
			// fulfillment handler; otherwise wrap the rejection to ensure the
			// types line up safely.
			if (onrejected === undefined || onrejected === null) {
				return this.promise.then(onfulfilled);
			}
			// This must use callbacks in order to satisfy PromiseLike semantics
			// and cannot be converted to async/await. Disable the rule locally.
			// oxlint-disable-next-line promise/prefer-await-to-callbacks
			return this.promise.then(onfulfilled, (error: unknown) => onrejected(error));
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
				const cached = internal.get(cacheKey.id);
				if (cached instanceof Promise) {
					// still pending — throw a thenable Error wrapper. React's
					// Suspense will treat thenables as suspendable; throwing an
					// Error subclass keeps the code compliant with lint rules.
					throw new ThenableError<TValue>(cached);
				}

				if (cached === undefined) {
					// Shouldn't happen given the earlier `has` check but guard for type safety
					throw new Error("missing cache value");
				}

				return cached;
			}

			const promise = (async () => {
				try {
					const result = await fetcher();
					internal.set(cacheKey.id, result);
					return result;
				} catch (error: unknown) {
					internal.delete(cacheKey.id);
					if (error instanceof Error) {
						throw error;
					}
					// preserve cause
					throw new Error(String(error), { cause: error });
				}
			})();

			internal.set(cacheKey.id, promise);
			// Throw a thenable Error wrapper (see above) so the thrown value
			// satisfies lint rules and remains usable by Suspense.
			throw new ThenableError<TValue>(promise);
		},
	} as const;
}
