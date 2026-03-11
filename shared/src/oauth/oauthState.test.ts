import { describe, expect, it } from "vitest";

import { parseOauthState } from "./oauthState";

describe("oauthState", () => {
	describe("parseOauthState", () => {
		it("decodes valid encoded oauth state", () => {
			const state = {
				csrf: "csrf-token-123",
				lang: "en",
				provider: "google",
			};
			const encoded = encodeURIComponent(JSON.stringify(state));
			const result = parseOauthState(encoded);
			expect(result.csrf).toBe(state.csrf);
			expect(result.lang).toBe(state.lang);
			expect(result.provider).toBe(state.provider);
		});

		it("decodes state with optional redirect fields", () => {
			const state = {
				csrf: "x",
				lang: "en",
				provider: "google",
				redirect_port: "5173",
				redirect_origin: "https://localhost:5173",
			};
			const encoded = encodeURIComponent(JSON.stringify(state));
			const result = parseOauthState(encoded);
			expect(result.redirect_port).toBe("5173");
			expect(result.redirect_origin).toBe("https://localhost:5173");
		});

		it("throws for invalid JSON", () => {
			expect(() => parseOauthState("not-valid-json")).toThrow(/JSON|SyntaxError/i);
		});

		it("throws for invalid schema (missing required fields)", () => {
			const invalid = encodeURIComponent(JSON.stringify({ csrf: "x" }));
			expect(() => parseOauthState(invalid)).toThrow(/decode|parse|required|invalid|lang|provider/i);
		});
	});
});
