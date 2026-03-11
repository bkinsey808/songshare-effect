import { describe, expect, it } from "vitest";

import {
	SigninErrorToken,
	codeQueryParam,
	justSignedInQueryParam,
	langQueryParam,
	providerQueryParam,
	redirectPortQueryParam,
	signinErrorQueryParam,
	stateQueryParam,
} from "./queryParams";

describe("queryParams", () => {
	it.each([
		["justSignedInQueryParam", justSignedInQueryParam, "justSignedIn"],
		["signinErrorQueryParam", signinErrorQueryParam, "signinError"],
		["providerQueryParam", providerQueryParam, "provider"],
		["codeQueryParam", codeQueryParam, "code"],
		["stateQueryParam", stateQueryParam, "state"],
		["redirectPortQueryParam", redirectPortQueryParam, "redirect_port"],
		["langQueryParam", langQueryParam, "lang"],
	] as const)("exports %s as %s", (_name, actual, expected) => {
		expect(actual).toBe(expected);
	});

	const SIGNIN_TOKEN_COUNT = 8;

	it("signin error token contains expected token values", () => {
		expect(SigninErrorToken.providerMismatch).toBe("providerMismatch");
		expect(SigninErrorToken.rateLimit).toBe("rateLimit");
		expect(SigninErrorToken.unknown).toBe("unknown");
		expect(Object.values(SigninErrorToken)).toHaveLength(SIGNIN_TOKEN_COUNT);
	});
});
