import { type Context } from "hono";

import { type Env } from "@/api/env";
import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

/**
 * Readonly wrapper for Hono Context specialized to this project's Bindings.
 *
 * Use this type in API helper parameters so the
 * `@typescript-eslint/prefer-readonly-parameter-types` rule is satisfied.
 *
 * @template ContextType - The Context shape; defaults to `{ Bindings: Env }`.
 *
 * @remarks
 * A shallow readonly is used to avoid deep recursive type expansion that can
 * cause excessive TypeScript instantiation errors with large ambient types
 * (for example, `Context` from `hono`). This keeps inference predictable
 * while still satisfying lint rules.
 */
export type ReadonlyContext<ContextType extends { Bindings: Env } = { Bindings: Env }> =
	ReadonlyDeep<Context<ContextType>>;
