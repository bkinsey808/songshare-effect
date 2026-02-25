import { describe, expect, it } from "vitest";

import type { Env } from "@/api/env";

import computeStateRedirectUri from "./computeStateRedirectUri";

const basePath = "/api/oauth/callback"; // same as shared/paths value in tests environment

function makeEnv(environment: string): Env {
	return {
		VITE_SUPABASE_URL: "",
		SUPABASE_SERVICE_KEY: "",
		SUPABASE_VISITOR_EMAIL: "",
		SUPABASE_VISITOR_PASSWORD: "",
		// the bucket value is never used in this helper; give a dummy object
		// typing is ignored because tests don't interact with the bucket.
		// @ts-expect-error dummy value satisfies Env but isn't used in tests
		BUCKET: {},
		ENVIRONMENT: environment,
	};
}

describe("computeStateRedirectUri", () => {
	it("appends callback path to trimmed origin", () => {
		const env = makeEnv("production");
		const uri = computeStateRedirectUri("https://example.com/", "", env);
		expect(uri).toBe(`https://example.com${basePath}`);
	});

	it("falls back to callback path when origin is empty", () => {
		const env = makeEnv("production");
		const uri = computeStateRedirectUri("", "", env);
		expect(uri).toBe(basePath);
	});

	it("uses localhost port override in non-production", () => {
		const env = makeEnv("development");
		const uri = computeStateRedirectUri("https://ignored.example", "1234", env);
		expect(uri).toBe(`https://localhost:1234${basePath}`);
	});

	it("does not use localhost override in production even if port provided", () => {
		const env = makeEnv("production");
		const uri = computeStateRedirectUri("https://example.com", "5678", env);
		expect(uri).toBe(`https://example.com${basePath}`);
	});
});
