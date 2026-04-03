import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import makeFakeSupabaseClient from "@/api/test-utils/makeFakeSupabaseClient.test-util";

import type { Bindings } from "../env";
import createR2Adapter from "./createR2Adapter";
import createSupabaseStorageAdapter from "./createSupabaseStorageAdapter";
import getStorageAdapter from "./getStorageAdapter";
import { makeFakeR2Bucket, makeMinimalStorageAdapter } from "./storage.test-util";

vi.mock("./createR2Adapter");
vi.mock("./createSupabaseStorageAdapter");
vi.mock("@supabase/supabase-js");

describe("getStorageAdapter", () => {
	it("returns R2 adapter when STORAGE_BACKEND is 'r2' and BUCKET is provided", () => {
		vi.resetAllMocks();
		const adapter = makeMinimalStorageAdapter();
		vi.mocked(createR2Adapter).mockReturnValue(adapter);

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

		expect(createR2Adapter).toHaveBeenCalledWith(fakeBucket);
		expect(result).toBe(adapter);
		expect(createClient).not.toHaveBeenCalled();
	});

	it("throws when STORAGE_BACKEND is 'r2' but BUCKET is missing", () => {
		vi.resetAllMocks();
		vi.mocked(createR2Adapter).mockReturnValue(makeMinimalStorageAdapter());

		const env: Bindings = {
			VITE_SUPABASE_URL: "",
			SUPABASE_SERVICE_KEY: "",
			SUPABASE_VISITOR_EMAIL: "x",
			SUPABASE_VISITOR_PASSWORD: "y",
			ENVIRONMENT: "test",
			STORAGE_BACKEND: "r2",
		};
		expect(() => getStorageAdapter(env)).toThrow(/no BUCKET binding/);
	});

	it("returns Supabase adapter by default", () => {
		vi.resetAllMocks();
		const fakeClient = makeFakeSupabaseClient();
		const supAdapter = makeMinimalStorageAdapter();

		vi.mocked(createClient).mockReturnValue(fakeClient);
		vi.mocked(createSupabaseStorageAdapter).mockReturnValue(supAdapter);

		const env: Bindings = {
			VITE_SUPABASE_URL: "url",
			SUPABASE_SERVICE_KEY: "key",
			SUPABASE_VISITOR_EMAIL: "x",
			SUPABASE_VISITOR_PASSWORD: "y",
			ENVIRONMENT: "test",
		};
		const result = getStorageAdapter(env);

		expect(createClient).toHaveBeenCalledWith("url", "key");
		expect(createSupabaseStorageAdapter).toHaveBeenCalledWith(fakeClient);
		expect(result).toBe(supAdapter);
	});
});
