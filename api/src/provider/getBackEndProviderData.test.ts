import { describe, expect, it } from "vitest";

import { Provider } from "@/shared/providers";

import getBackEndProviderData from "./getBackEndProviderData";

describe("getBackEndProviderData", () => {
	it("returns config for google provider", () => {
		const data = getBackEndProviderData(Provider.google);
		expect(data.authBaseUrl).toContain("accounts.google.com");
		expect(data.accessTokenUrl).toContain("googleapis.com");
		expect(data.userInfoUrl).toContain("userinfo");
		expect(data.clientIdEnvVar).toBe("GOOGLE_CLIENT_ID");
		expect(data.clientSecretEnvVar).toBe("GOOGLE_CLIENT_SECRET");
	});

	it("returns config for microsoft provider", () => {
		const data = getBackEndProviderData(Provider.microsoft);
		expect(data.authBaseUrl).toContain("microsoftonline");
		expect(data.clientIdEnvVar).toBe("MS_CLIENT_ID");
	});

	it("returns config for amazon provider", () => {
		const data = getBackEndProviderData(Provider.amazon);
		expect(data.authBaseUrl).toContain("amazon.com");
		expect(data.clientIdEnvVar).toBe("AMAZON_CLIENT_ID");
	});

	it("returns unique config per provider", () => {
		const google = getBackEndProviderData(Provider.google);
		const ms = getBackEndProviderData(Provider.microsoft);
		expect(google.clientIdEnvVar).not.toBe(ms.clientIdEnvVar);
		expect(google.authBaseUrl).not.toBe(ms.authBaseUrl);
	});
});
