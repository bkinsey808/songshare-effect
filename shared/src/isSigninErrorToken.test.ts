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

	it("type guard accepts valid tokens", () => {
		for (const t of allValues) {
			expect(isSigninErrorToken(t)).toBe(true);
		}
	});

	it("type guard rejects bad values", () => {
		expect(isSigninErrorToken("not-a-token")).toBe(false);
		expect(isSigninErrorToken(undefined)).toBe(false);
		expect(isSigninErrorToken(invalidNumber as unknown)).toBe(false);
	});
});
