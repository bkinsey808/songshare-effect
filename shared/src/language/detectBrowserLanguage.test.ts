import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import detectBrowserLanguage from "./detectBrowserLanguage";

describe("detectBrowserLanguage", () => {
	it("returns defaultLanguage when acceptLanguage is undefined", () => {
		// Arrange
		const input: string | undefined = undefined;

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe(defaultLanguage);
	});

	it("returns defaultLanguage when acceptLanguage is empty", () => {
		// Arrange
		const input = "";

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe(defaultLanguage);
	});

	it("returns defaultLanguage when no supported language is found", () => {
		// Arrange
		const input = "fr,de";

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe(defaultLanguage);
	});

	it("detects 'en' from 'en-US,en;q=0.9'", () => {
		// Arrange
		const input = "en-US,en;q=0.9";

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe("en");
	});

	it("detects 'zh' from 'zh-CN,zh;q=0.9,en;q=0.8'", () => {
		// Arrange
		const input = "zh-CN,zh;q=0.9,en;q=0.8";

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe("zh");
	});

	it("detects 'es' from 'es;q=0.9,en;q=0.8'", () => {
		// Arrange
		const input = "es;q=0.9,en;q=0.8";

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe("es");
	});

	it("handles malformed acceptLanguage string", () => {
		// Arrange
		const input = ",,,;";

		// Act
		const result = detectBrowserLanguage(input);

		// Assert
		expect(result).toBe(defaultLanguage);
	});
});
