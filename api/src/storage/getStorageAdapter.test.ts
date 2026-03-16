import { describe, it, expect, vi } from "vitest";
import type { Bindings } from "../env";
import { makeFakeR2Bucket, mockCreateR2Adapter, mockSupabaseCreateClient, mockCreateSupabaseStorageAdapter } from "./test-utils/mocks.test-util";

describe("getStorageAdapter", () => {
  it("returns R2 adapter when STORAGE_BACKEND is 'r2' and BUCKET is provided", async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const adapter = { kind: "r2" };

    const { fn: createR2AdapterMock } = await mockCreateR2Adapter(adapter);
    // Ensure supabase client is not used in this path
    const { fn: createClientMock } = await mockSupabaseCreateClient({});

    const { default: getStorageAdapter } = await import("./getStorageAdapter");

    const fakeBucket = makeFakeR2Bucket();
    const env: Bindings = {
      VITE_SUPABASE_URL: "",
      SUPABASE_SERVICE_KEY: "",
      SUPABASE_VISITOR_EMAIL: "x",
      SUPABASE_VISITOR_PASSWORD: "y",
      ENVIRONMENT: "test",
      STORAGE_BACKEND: "r2",
      BUCKET: fakeBucket,
    };
    const result = getStorageAdapter(env);

    expect(createR2AdapterMock).toHaveBeenCalledWith(fakeBucket);
    expect(result).toBe(adapter);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("throws when STORAGE_BACKEND is 'r2' but BUCKET is missing", async () => {
    vi.resetModules();
    vi.clearAllMocks();

    await mockCreateR2Adapter({});
    await mockSupabaseCreateClient({});
    const { default: getStorageAdapter } = await import("./getStorageAdapter");

    const env2: Bindings = {
      VITE_SUPABASE_URL: "",
      SUPABASE_SERVICE_KEY: "",
      SUPABASE_VISITOR_EMAIL: "x",
      SUPABASE_VISITOR_PASSWORD: "y",
      ENVIRONMENT: "test",
      STORAGE_BACKEND: "r2",
    };
    expect(() => getStorageAdapter(env2)).toThrow(/no BUCKET binding/);
  });

  it("returns Supabase adapter by default", async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const fakeClient = { id: "c" };
    const supAdapter = { kind: "supabase" };

    const { fn: createClientMock } = await mockSupabaseCreateClient(fakeClient);
    const { fn: createSupabaseStorageAdapterMock } = await mockCreateSupabaseStorageAdapter(supAdapter);

    const { default: getStorageAdapter } = await import("./getStorageAdapter");

    const env3: Bindings = {
      VITE_SUPABASE_URL: "url",
      SUPABASE_SERVICE_KEY: "key",
      SUPABASE_VISITOR_EMAIL: "x",
      SUPABASE_VISITOR_PASSWORD: "y",
      ENVIRONMENT: "test",
    };
    const result = getStorageAdapter(env3);

    expect(createClientMock).toHaveBeenCalledWith("url", "key");
    expect(createSupabaseStorageAdapterMock).toHaveBeenCalledWith(fakeClient);
    expect(result).toBe(supAdapter);
  });
});
