// Utility type: DeepReadonly
// Recursively marks all nested properties as readonly while preserving
// function signatures unmodified.
// We intentionally detect function types using a wide call signature so
// methods like `ctx.redirect` keep their callable type when wrapped with
// `DeepReadonly`. Using a rest parameter of `readonly unknown[]` satisfies
// eslint rules (no global `Function` type) and matches the majority of
// function signatures without requiring `any`.
// Use `unknown[]` for the rest parameter so that any callable signature is
// matched (preserving methods as callable). Prefer `unknown` over `any` to
// avoid relaxed typing.
// Prefer pattern-matching call signatures using `infer` so we catch any
// callable type without using the global `Function` type nor `any`.
// Limit recursion depth to prevent excessive type-instantiation errors
// in complex ambient types such as `Context` from `hono`.
type _Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type DeepReadonly<T, D extends number = 5> = D extends 0
	? T
	: T extends (...args: infer _A) => infer _R
		? T
		: T extends { req: unknown; res: unknown }
			? T
			: T extends ReadonlyArray<infer U>
				? ReadonlyArray<DeepReadonly<U, _Prev[D]>>
				: T extends Map<infer K, infer V>
					? ReadonlyMap<DeepReadonly<K, _Prev[D]>, DeepReadonly<V, _Prev[D]>>
					: T extends Set<infer U>
						? ReadonlySet<DeepReadonly<U, _Prev[D]>>
						: T extends object
							? { readonly [P in keyof T]: DeepReadonly<T[P], _Prev[D]> }
							: T;

// Alias with a friendlier name for callers
export type ReadonlyDeep<T> = DeepReadonly<Readonly<T>>;
