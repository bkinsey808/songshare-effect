import { describe, expect, it } from "vitest";

import {
	SigninErrorToken,
	type SigninErrorToken as SigninErrorTokenType,
} from "@/shared/queryParams";

import isSigninErrorToken from "./isSigninErrorToken";
// token values are defined and exported from `queryParams`; the guard is
// tested via `isSigninErrorToken` below.  The imported constant is used only
// to iterate the values.

// simple compile-time safety: the imported `SigninErrorTokenType` already
// expresses the value union we need, so we can use it directly.

describe("signinTokens exports", () => {
	const allValues: readonly SigninErrorTokenType[] = Object.values(
		SigninErrorToken,
	) as readonly SigninErrorTokenType[];
	const invalidNumber = 123;

	const VALID_ROWS = allValues.map((token) => ({ token }));
	const INVALID_ROWS = [
		{ value: "not-a-token" },
		{ value: undefined },
		{ value: invalidNumber as unknown },
	];

	it.each(VALID_ROWS)("accepts valid token $token", ({ token }) => {
		// Act
		const result = isSigninErrorToken(token);

		// Assert
		expect(result).toBe(true);
	});

	it.each(INVALID_ROWS)("rejects invalid value %#", ({ value }) => {
		// Act
		const result = isSigninErrorToken(value);

		// Assert
		expect(result).toBe(false);
	});
});
