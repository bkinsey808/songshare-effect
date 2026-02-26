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
	/** Override request properties such as method, url */
	req?: Partial<{ method: string; url: string }>;
	/** Optional spy for `res.headers.append` — pass `vi.fn()` in tests when you need assertions */
	resHeadersAppend?: (name: string, value: string) => void;
	/** Optional spy for `ctx.redirect` */
	redirect?: (location: string, status?: number) => Response;
};

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
		header: (name: string) => opts.headers?.[name] ?? opts.headers?.[name.toLowerCase()] ?? "",
		url: opts.req?.url ?? "https://example.test/api/test",
		method: opts.req?.method ?? "GET",
		raw: {
			headers: {
				/* oxlint-disable-next-line unicorn/no-null -- Fetch API headers.get returns null when missing */
				get: (name: string) => opts.headers?.[name] ?? opts.headers?.[name.toLowerCase()] ?? null,
			},
		},
	} as unknown;

	const resHeaders = new Headers();
	const res = {
		headers: {
			append: (name: string, value: string) => {
				resHeaders.append(name, value);
				opts.resHeadersAppend?.(name, value);
			},
			get: (name: string) => resHeaders.get(name),
		},
	} as unknown;

	// `ctx.header` is a convenience wrapper Hono provides; allow tests to inject
	// a spy for it.
	const headerFn = opts.header ?? ((): void => undefined);

	const DEFAULT_REDIRECT_STATUS = 302;
	const redirectFn =
		opts.redirect ??
		((location: string, status = DEFAULT_REDIRECT_STATUS): Response =>
			/* oxlint-disable-next-line unicorn/no-null -- Response body can be null */
			new Response(null, { status, headers: { Location: location } }));

	// Return a minimal ReadonlyContext for tests. Keep the unsafe cast localized
	// so test files don't need to repeat inline eslint disables.
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only narrow cast to ReadonlyContext */
	return {
		env,
		req,
		res,
		header: headerFn,
		json: (body: unknown) => body,
		redirect: redirectFn,
	} as unknown as ReadonlyContext;
}
