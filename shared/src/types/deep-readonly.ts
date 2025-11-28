// This file intentionally uses numeric literal recursion bounds in types.
// Keep the noisy `no-magic-numbers` rule disabled only where it's necessary
// (the recursive length tuple) rather than the entire file.
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
// oxlint-disable-next-line no-magic-numbers
type _Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// The default recursion depth and the comparison against zero are type-level
// numeric literals that are meaningful in this algorithmic type. Keep the
// rule disabled just for the declaration below.
// oxlint-disable-next-line no-magic-numbers
type DeepReadonly<TValue, Depth extends number = 5> = Depth extends 0
	? TValue
	: TValue extends (...args: infer _Args) => infer _Return
		? TValue
		: TValue extends { req: unknown; res: unknown }
			? TValue
			: TValue extends ReadonlyArray<infer Item>
				? ReadonlyArray<DeepReadonly<Item, _Prev[Depth]>>
				: TValue extends Map<infer Key, infer Value>
					? ReadonlyMap<
							DeepReadonly<Key, _Prev[Depth]>,
							DeepReadonly<Value, _Prev[Depth]>
						>
					: TValue extends Set<infer Item>
						? ReadonlySet<DeepReadonly<Item, _Prev[Depth]>>
						: TValue extends object
							? {
									readonly [Prop in keyof TValue]: DeepReadonly<
										TValue[Prop],
										_Prev[Depth]
									>;
								}
							: TValue;

// Alias with a friendlier name for callers
export type ReadonlyDeep<TValue> = DeepReadonly<Readonly<TValue>>;
