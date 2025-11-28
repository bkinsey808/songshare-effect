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
						throw err;
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
	// getOrThrow: either returns a resolved TValue or throws a pending Promise for Suspense
	getOrThrow(
		id: string,
		fetcher: () => Promise<TValue>,
	): TValue | Promise<TValue>;
	has(id: string): boolean;
	delete(id: string): boolean;
	clear(): void;
}>;

export function createSuspenseCache<TValue>(
	prefix?: string,
): SuspenseCache<TValue> {
	const keyFactory = createCacheKeyFactory<TValue>(prefix);
	const internal = new Map<symbol, Promise<TValue> | TValue>();

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
					// still pending — throw to suspend (intentional)
					// eslint-disable-next-line @typescript-eslint/only-throw-error
					throw cached;
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
					throw err;
				},
			);

			internal.set(cacheKey.id, promise);
			// eslint-disable-next-line @typescript-eslint/only-throw-error
			throw promise;
		},
	} as const;
}
