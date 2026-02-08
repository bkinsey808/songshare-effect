import { describe, expect, it } from "vitest";

import generateSlug from "./generateSlug";

describe("generateSlug", () => {
	it("lowercases and replaces whitespace with dashes and removes invalid chars", () => {
		expect(generateSlug("My Song Name")).toBe("my-song-name");
		expect(generateSlug("  Hello   World  ")).toBe("hello-world");
		expect(generateSlug("C# Major! (Live)")).toBe("c-major-live");
		expect(generateSlug("--weird--name--")).toBe("weird-name");
		// underscores should become dashes
		expect(generateSlug("under_score_name")).toBe("under-score-name");
	});

	it("collapses multiple dashes and spaces", () => {
		expect(generateSlug("a   b--c")).toBe("a-b-c");
	});
});
