import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import { HTTP_OK } from "@/shared/constants/http";

import supabaseHealthMiddleware from "./supabaseHealth";

/**
 * Reset health check state between tests.
 * @returns void
 */
function resetHealthCheckGlobal(): void {
	const glob = forceCast<{ __songshare_supabase_health_checked?: boolean }>(globalThis);
	delete glob.__songshare_supabase_health_checked;
}

/**
 * Creates a mocked 'next' function for Hono middleware.
 * @returns Mocked function
 */
function makeNext(): ReturnType<typeof vi.fn> {
	return vi.fn().mockResolvedValue(undefined);
}

const EXPECTED_CALL_COUNT = 1;

describe("supabaseHealthMiddleware", () => {
	it("runs health check on first request and calls next", async () => {
		resetHealthCheckGlobal();
		const next = makeNext();
		const originalFetch = globalThis.fetch;
		const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: HTTP_OK });
		vi.stubGlobal("fetch", mockFetch);

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "https://project.supabase.co" },
		});

		try {
			await supabaseHealthMiddleware(ctx, forceCast<() => Promise<unknown>>(next));

			expect(next).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://project.supabase.co",
				expect.objectContaining({ method: "HEAD" }),
			);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("skips health check on second request (one-time only)", async () => {
		resetHealthCheckGlobal();
		const next = makeNext();
		const originalFetch = globalThis.fetch;
		const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: HTTP_OK });
		vi.stubGlobal("fetch", mockFetch);

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "https://project.supabase.co" },
		});

		try {
			await supabaseHealthMiddleware(ctx, forceCast<() => Promise<unknown>>(next));
			expect(mockFetch).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);

			next.mockClear();
			await supabaseHealthMiddleware(ctx, forceCast<() => Promise<unknown>>(next));

			expect(next).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
			expect(mockFetch).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("calls next without fetch when VITE_SUPABASE_URL is empty", async () => {
		resetHealthCheckGlobal();
		const next = makeNext();
		const originalFetch = globalThis.fetch;
		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "" },
		});

		try {
			await supabaseHealthMiddleware(ctx, forceCast<() => Promise<unknown>>(next));

			expect(next).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
			expect(mockFetch).not.toHaveBeenCalled();
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("calls next even when health check fetch fails", async () => {
		resetHealthCheckGlobal();
		const next = makeNext();
		const originalFetch = globalThis.fetch;
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "https://project.supabase.co" },
		});

		try {
			await supabaseHealthMiddleware(ctx, forceCast<() => Promise<unknown>>(next));

			expect(next).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
