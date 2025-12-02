import { describe, expect, it } from "vitest";

import resolveRedirectOrigin from "./resolveRedirectOrigin";

describe("resolveRedirectOrigin", () => {
	it("prefers incoming request scheme for localhost in non-production", () => {
		const env = "https://localhost:5173";
		const req = "http://localhost:5173";
		const out = resolveRedirectOrigin(env, {
			requestOrigin: req,
			isProd: false,
		});
		expect(out).toBe(req);
	});

	it("respects configured origin for localhost in production", () => {
		const env = "https://localhost:5173";
		const req = "http://localhost:5173";
		const out = resolveRedirectOrigin(env, {
			requestOrigin: req,
			isProd: true,
		});
		expect(out).toBe(env);
	});

	it("uses env when non-localhost env is present", () => {
		const env = "https://example.com";
		const req = "http://localhost:5173";
		const out = resolveRedirectOrigin(env, {
			requestOrigin: req,
			isProd: false,
		});
		expect(out).toBe(env);
	});

	it("falls back to request origin when env is empty", () => {
		const env = "";
		const req = "http://localhost:5173";
		const out = resolveRedirectOrigin(env, {
			requestOrigin: req,
			isProd: false,
		});
		expect(out).toBe(req);
	});
});
