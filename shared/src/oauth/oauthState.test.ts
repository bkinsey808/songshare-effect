import { describe, expect, it } from "vitest";

import { parseOauthState } from "./oauthState";

describe("parseOauthState", () => {
	it("decodes a valid encoded oauth state string", () => {
		const state = { csrf: "c", lang: "en", provider: "google", redirect_port: "3000" };
		const encoded = encodeURIComponent(JSON.stringify(state));

		expect(parseOauthState(encoded)).toStrictEqual(state);
	});

	it("throws for invalid JSON or URI-encoded input", () => {
		expect(() => parseOauthState("not-json")).toThrow(Error);
	});

	it("throws when schema validation fails (invalid lang)", () => {
		const bad = { csrf: "c", lang: "xx", provider: "google" };
		const encoded = encodeURIComponent(JSON.stringify(bad));
		expect(() => parseOauthState(encoded)).toThrow(Error);
	});
});
