import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { RegisterFormFields, RegisterFormSchema } from "./register";

const USERNAME_MAX_LENGTH = 30;
const OVER_MAX_LENGTH = 31;
const LENGTH_ONE = 1;

describe("register", () => {
	describe("register form schema", () => {
		const validUsernames = [
			{ name: "valid 5-char", username: "alice" },
			{ name: "valid with digits", username: "user123" },
			{ name: "valid with underscore and hyphen", username: "a_b-c" },
			{ name: "valid min length", username: "abc" },
			{ name: "valid max length", username: "a".repeat(USERNAME_MAX_LENGTH) },
		] as const;

		it.each(validUsernames)("decodes valid username: $name", ({ username }) => {
			// Act
			const decoded = Schema.decodeSync(RegisterFormSchema)({ username });
			// Assert
			expect(decoded.username).toBe(username);
		});

		const invalidUsernames = [
			{ name: "too short", username: "ab" },
			{ name: "empty", username: "" },
			{ name: "too long", username: "a".repeat(OVER_MAX_LENGTH) },
			{ name: "invalid chars - at symbol", username: "user@mail" },
			{ name: "invalid chars - space", username: "space in" },
		] as const;

		it.each(invalidUsernames)("rejects invalid username: $name", ({ username }) => {
			// Act
			const result = Schema.decodeUnknownEither(RegisterFormSchema)({ username });
			// Assert
			expect(result._tag).toBe("Left");
		});
	});

	it("register form fields contains username", () => {
		// Assert
		expect(RegisterFormFields).toContain("username");
		expect(RegisterFormFields).toHaveLength(LENGTH_ONE);
	});
});
