import { describe, expect, it } from "vitest";

import { Provider } from "@/shared/providers";

import getBackEndProviderData from "./getBackEndProviderData";

describe("getBackEndProviderData", () => {
	it("returns backend config for google", () => {
		const data = getBackEndProviderData(Provider.google);
		expect(data.clientIdEnvVar).toBe("GOOGLE_CLIENT_ID");
		expect(data.authBaseUrl).toContain("google");
	});

	it("returns backend config for microsoft", () => {
		const data = getBackEndProviderData(Provider.microsoft);
		expect(data.clientIdEnvVar).toBe("MS_CLIENT_ID");
	});
});
