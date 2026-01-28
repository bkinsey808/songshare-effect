// Centralized test helper to create a minimal ReadonlyContext for tests that
// need to call API helpers. This centralizes the required unsafe casts so
// individual tests don't need their own eslint-disable comments.
import type { Env } from "@/api/env";
import type { ReadonlyContext } from "@/api/hono/hono-context";

export default function makeCtx(): ReadonlyContext {
	// Narrowly-scoped unsafe cast to `Env` for test helper only
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast for Env
	const env = {
		VITE_SUPABASE_URL: "https://supabase.example",
		SUPABASE_SERVICE_KEY: "service-key",
		SUPABASE_VISITOR_EMAIL: "visitor@example.com",
		SUPABASE_VISITOR_PASSWORD: "visitor-pass",
	} as unknown as Env;

	// Narrowly-scoped unsafe cast to `ReadonlyContext` for test helper only
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only narrow cast to ReadonlyContext
	return { env } as unknown as ReadonlyContext;
}
