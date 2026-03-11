import { describe, expect, it } from "vitest";

import { Provider } from "@/shared/providers";

import { providerBackEndData } from "./providerBackEndData";

describe("providerBackEndData", () => {
	const expectedKeys = [
		"accessTokenUrl",
		"userInfoUrl",
		"clientIdEnvVar",
		"clientSecretEnvVar",
		"authBaseUrl",
	] as const;

	it.each([
		["google", Provider.google],
		["microsoft", Provider.microsoft],
		["amazon", Provider.amazon],
	] as const)("has config for %s provider", (_name, provider) => {
		const config = providerBackEndData[provider];
		expect(config).toBeDefined();
		for (const key of expectedKeys) {
			expect(config[key]).toBeDefined();
			expect(typeof config[key]).toBe("string");
		}
	});

	it("google authBaseUrl points to accounts.google.com", () => {
		expect(providerBackEndData[Provider.google].authBaseUrl).toContain("accounts.google.com");
	});

	it("microsoft authBaseUrl points to login.microsoftonline.com", () => {
		expect(providerBackEndData[Provider.microsoft].authBaseUrl).toContain(
			"login.microsoftonline.com",
		);
	});
});
