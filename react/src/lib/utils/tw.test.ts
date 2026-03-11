import { describe, expect, it } from "vitest";

import tw from "./tw";

describe("tw", () => {
	it("returns static class string", () => {
		expect(tw`flex gap-2`).toBe("flex gap-2");
	});

	it("handles empty template", () => {
		expect(tw``).toBe("");
	});

	it("preserves static class list", () => {
		expect(tw`p-4 m-2 text-center`).toBe("p-4 m-2 text-center");
	});
});
