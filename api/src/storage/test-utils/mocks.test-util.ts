/*
  Helper utilities for mocking storage-related modules in tests.
  This file intentionally performs loose type assertions to keep test code
  simple; the assertions are confined to this helper to avoid spreading
  disables across many test files.
*/
/* eslint-disable */
import { vi } from "vitest";
import type { R2Bucket } from "@cloudflare/workers-types";

export async function mockCreateR2Adapter(
  adapter: unknown,
): Promise<{ mod: unknown; fn: ReturnType<typeof vi.fn> }> {
  vi.doMock("./createR2Adapter");
  const mod = await import("../createR2Adapter");
  const spy = vi.spyOn(mod as any, "default").mockImplementation(() => adapter as any);
  return { mod, fn: spy } as const;
}

export async function mockSupabaseCreateClient(
  fakeClient: unknown,
): Promise<{ mod: unknown; fn: ReturnType<typeof vi.fn> }> {
  vi.doMock("@supabase/supabase-js");
  const mod = await import("@supabase/supabase-js");
  const spy = vi.spyOn(mod as any, "createClient").mockImplementation(() => fakeClient as any);
  return { mod, fn: spy } as const;
}

export async function mockCreateSupabaseStorageAdapter(
  adapter: unknown,
): Promise<{ mod: unknown; fn: ReturnType<typeof vi.fn> }> {
  vi.doMock("./createSupabaseStorageAdapter");
  const mod = await import("../createSupabaseStorageAdapter");
  const spy = vi.spyOn(mod as any, "default").mockImplementation(() => adapter as any);
  return { mod, fn: spy } as const;
}

export function makeFakeR2Bucket(): R2Bucket {
  // This helper intentionally uses unsafe casts confined to this test util.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  const bucket = {
    put: async (_key: string, _value: unknown, _options?: unknown) => {
      await Promise.resolve();
      return {} as any;
    },
    delete: async (_key: string) => {
      await Promise.resolve();
    },
  } as unknown as R2Bucket;
  return bucket;
}
