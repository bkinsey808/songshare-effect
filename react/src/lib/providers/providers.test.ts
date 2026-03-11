import { describe, expect, it } from "vitest";

import { Provider } from "@/shared/providers";

import getFrontEndProviderData from "./providers";

describe("getFrontEndProviderData", () => {
	it("returns frontend config for google", () => {
		const data = getFrontEndProviderData(Provider.google);
		expect(data.brandColor).toBe("#fff");
		expect(data.textColor).toBe("#3c4043");
	});

	it("returns frontend config for microsoft", () => {
		const data = getFrontEndProviderData(Provider.microsoft);
		expect(data.brandColor).toBe("#2F2F2F");
		expect(data.textColor).toBe("#fff");
	});

	it("returns frontend config for amazon", () => {
		const data = getFrontEndProviderData(Provider.amazon);
		expect(data.brandColor).toBe("#FF9900");
		expect(data.textColor).toBe("#232F3E");
	});

	it("includes Icon component for each provider", () => {
		const googleData = getFrontEndProviderData(Provider.google);
		const microsoftData = getFrontEndProviderData(Provider.microsoft);
		const amazonData = getFrontEndProviderData(Provider.amazon);

		expect(typeof googleData.Icon).toBe("function");
		expect(typeof microsoftData.Icon).toBe("function");
		expect(typeof amazonData.Icon).toBe("function");
	});
});
