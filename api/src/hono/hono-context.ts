import { type Context } from "hono";

import { type Env } from "@/api/env";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

/**
 * Readonly wrapper for Hono `Context` specialized to this project's `Bindings`.
 *
 * Use: `ReadonlyContext<{ Bindings: Env }>` for api helper params so the
 * `@typescript-eslint/prefer-readonly-parameter-types` rule can be satisfied.
 */
// Use shallow Readonly for Hono Context wrappers to avoid deep recursion in
// TypeScript's type system. DeepReadonly caused excessive type instantiation
// errors when used with complex ambient types like `Context` from `hono`.
// A shallow `Readonly` still satisfies `@typescript-eslint/prefer-readonly-parameter-types`
// while behaving predictably with large library types.
export type ReadonlyContext<
	ContextType extends { Bindings: Env } = { Bindings: Env },
> = ReadonlyDeep<Context<ContextType>>;

// Alias that intentionally prevents repeated type expansion during inference
// by providing a small, optional property. Use this in APIs that accept a
// function argument (like `handleHttpEndpoint`) so TypeScript won't recursively
// expand the underlying `Context` during inference.
export type ReadonlyContextNoInfer<
	ContextType extends { Bindings: Env } = { Bindings: Env },
> = ReadonlyDeep<Context<ContextType>> & {
	readonly __preventTypeExpansion?: never;
};
