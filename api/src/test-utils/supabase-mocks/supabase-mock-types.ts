export type MaybeSingleResult = Promise<{ data: unknown; error: unknown } | undefined>;
export type SingleResult = Promise<{ data: unknown; error: unknown }>;
export type MultiResult = Promise<{ data: unknown[] | null; error: unknown }>;
export type MultiMaybeResult = Promise<{ data: unknown[] | null | undefined; error: unknown }>;

export type SingleBuilder = { single: () => SingleResult };
export type MaybeSingleBuilder = { single: () => MaybeSingleResult };
