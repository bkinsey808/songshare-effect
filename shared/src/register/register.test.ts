import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { RegisterFormFields, RegisterFormSchema } from "./register";

const USERNAME_MAX_LENGTH = 30;
const OVER_MAX_LENGTH = 31;
const LENGTH_ONE = 1;

describe("register", () => {
	describe("register form schema", () => {
		it.each([
			["alice", "valid 5-char"],
			["user123", "valid with digits"],
			["a_b-c", "valid with underscore and hyphen"],
			["abc", "valid min length"],
			["a".repeat(USERNAME_MAX_LENGTH), "valid max length"],
		] as const)("decodes valid username: %s", (username, _description) => {
			const decoded = Schema.decodeSync(RegisterFormSchema)({ username });
			expect(decoded.username).toBe(username);
		});

		it.each([
			["ab", "too short"],
			["", "empty"],
			["a".repeat(OVER_MAX_LENGTH), "too long"],
			["user@mail", "invalid chars"],
			["space in", "invalid chars"],
		] as const)("rejects invalid username: %s", (username, _description) => {
			const result = Schema.decodeUnknownEither(RegisterFormSchema)({ username });
			expect(result._tag).toBe("Left");
		});
	});

	it("register form fields contains username", () => {
		expect(RegisterFormFields).toContain("username");
		expect(RegisterFormFields).toHaveLength(LENGTH_ONE);
	});
});
