// Centralized test helper to create a minimal ReadonlyContext for tests that
// need to call API helpers. This centralizes the required unsafe casts so
// individual tests don't need their own oxlint-disable comments.
import type { Env } from "@/api/env";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

/**
 * Create a minimal ReadonlyContext for tests.
 *
 * The helper centralizes a couple of narrow, documented casts (Env and
 * ReadonlyContext) so tests can build contexts succinctly without repeating
 * inline disables throughout the codebase.
 *
 * @returns A lightweight `ReadonlyContext` suitable for unit tests
 */
type MakeCtxOpts = {
	body?: unknown;
	env?: Partial<Env>;
	headers?: Record<string, string>;
	/** Spy for `ctx.header` (response‑side header setter) */
	header?: (name: string, value: string) => void;
	/** Override request properties such as method */
	req?: Partial<{ method: string }>;
	/** Optional spy for `res.headers.append` — pass `vi.fn()` in tests when you need assertions */
	resHeadersAppend?: (name: string, value: string) => void;
};

function noop(): void {
	// Intentionally empty — used as safe default for `res.headers.append` in tests
	return undefined;
}

export default function makeCtx(opts: MakeCtxOpts = {}): ReadonlyContext {
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast for Env */
	const env = {
		VITE_SUPABASE_URL: "https://supabase.example",
		SUPABASE_SERVICE_KEY: "service-key",
		JWT_SECRET: "jwt-secret",
		SUPABASE_VISITOR_EMAIL: "visitor@example.com",
		SUPABASE_VISITOR_PASSWORD: "visitor-pass",
		...opts.env,
	} as unknown as Env;

	const req = {
		json: () => {
			if (opts.body instanceof Error) {
				return Promise.reject(opts.body);
			}
			return Promise.resolve(opts.body ?? { username: "new-user" });
		},
		header: (_name: string) => opts.headers?.[_name] ?? "",
		url: "https://example.test/api/test",
		method: opts.req?.method ?? "GET",
	} as unknown;

	const res = { headers: { append: opts.resHeadersAppend ?? noop } } as unknown;

	// `ctx.header` is a convenience wrapper Hono provides; allow tests to inject
	// a spy for it.
	const headerFn = opts.header ?? ((): void => undefined);
	// Return a minimal ReadonlyContext for tests. Keep the unsafe cast localized
	// so test files don't need to repeat inline eslint disables.
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only narrow cast to ReadonlyContext */
	return {
		env,
		req,
		res,
		header: headerFn,
		json: (body: unknown) => body,
	} as unknown as ReadonlyContext;
}
