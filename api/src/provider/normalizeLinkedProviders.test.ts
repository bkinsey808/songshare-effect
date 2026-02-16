import { describe, expect, it } from "vitest";

import normalizeLinkedProviders from "./normalizeLinkedProviders";

describe("normalizeLinkedProviders", () => {
	it("returns empty array for non-record input", () => {
		expect(normalizeLinkedProviders("x")).toStrictEqual([]);
	});

	it("parses comma-separated provider string", () => {
		expect(normalizeLinkedProviders({ linked_providers: "google, microsoft " })).toStrictEqual([
			"google",
			"microsoft",
		]);
	});

	it("normalizes array values and filters null/empty", () => {
		expect(normalizeLinkedProviders({ linked_providers: ["google", undefined, ""] })).toStrictEqual(
			["google", "undefined"],
		);
	});
});
