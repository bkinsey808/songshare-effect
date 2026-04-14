import { describe, expect, it } from "bun:test";

import resolveSecretSource from "./resolveSecretSource";

const SECRET_NAME = "VITE_SUPABASE_URL";

describe("resolveSecretSource", () => {
	it("prefers an existing environment value", () => {
		// Act
		const result = resolveSecretSource({
			currentValue: "https://example.supabase.co",
			isCI: true,
			keyringAvailable: false,
			secretName: SECRET_NAME,
		});

		// Assert
		expect(result).toBe("env");
	});

	it("uses keyring when no environment value is present and keyring is available", () => {
		// Act
		const result = resolveSecretSource({
			currentValue: undefined,
			isCI: false,
			keyringAvailable: true,
			secretName: SECRET_NAME,
		});

		// Assert
		expect(result).toBe("keyring");
	});

	it("skips keyring in CI when the executable is unavailable", () => {
		// Act
		const result = resolveSecretSource({
			currentValue: undefined,
			isCI: true,
			keyringAvailable: false,
			secretName: SECRET_NAME,
		});

		// Assert
		expect(result).toBe("skip");
	});

	it("throws in local runs when keyring is required but unavailable", () => {
		// Act & Assert
		expect(() =>
			resolveSecretSource({
				currentValue: undefined,
				isCI: false,
				keyringAvailable: false,
				secretName: SECRET_NAME,
			}),
		).toThrow(`The "keyring" executable is required to load ${SECRET_NAME}.`);
	});
});
