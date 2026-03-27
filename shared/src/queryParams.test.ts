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
	const paramCases = [
		{ name: "justSignedInQueryParam", actual: justSignedInQueryParam, expected: "justSignedIn" },
		{ name: "signinErrorQueryParam", actual: signinErrorQueryParam, expected: "signinError" },
		{ name: "providerQueryParam", actual: providerQueryParam, expected: "provider" },
		{ name: "codeQueryParam", actual: codeQueryParam, expected: "code" },
		{ name: "stateQueryParam", actual: stateQueryParam, expected: "state" },
		{ name: "redirectPortQueryParam", actual: redirectPortQueryParam, expected: "redirect_port" },
		{ name: "langQueryParam", actual: langQueryParam, expected: "lang" },
	] as const;

	it.each(paramCases)("exports $name as expected", ({ actual, expected }) => {
		// Assert
		expect(actual).toBe(expected);
	});

	const SIGNIN_TOKEN_COUNT = 8;

	it("signin error token contains expected token values", () => {
		// Assert
		expect(SigninErrorToken.providerMismatch).toBe("providerMismatch");
		expect(SigninErrorToken.rateLimit).toBe("rateLimit");
		expect(SigninErrorToken.unknown).toBe("unknown");
		expect(Object.values(SigninErrorToken)).toHaveLength(SIGNIN_TOKEN_COUNT);
	});
});
