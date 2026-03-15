import { describe, expect, it, vi } from "vitest";

import buildPublicWebUrl from "./buildPublicWebUrl";
import getPublicWebBaseUrl from "./getPublicWebBaseUrl";

vi.mock("./getPublicWebBaseUrl");

describe("buildPublicWebUrl", () => {
	it("returns localized path when base URL is unavailable", () => {
		vi.mocked(getPublicWebBaseUrl).mockReturnValue("");

		expect(buildPublicWebUrl("/user/mettaben", "en")).toBe("/en/user/mettaben");
	});

	it("prefixes localized path with base URL when available", () => {
		vi.mocked(getPublicWebBaseUrl).mockReturnValue("https://effect.example.com");

		expect(buildPublicWebUrl("/user/mettaben", "en")).toBe(
			"https://effect.example.com/en/user/mettaben",
		);
	});
});
