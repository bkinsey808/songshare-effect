import { describe, expect, it } from "vitest";

import generateSlug from "./generateSlug";

describe("generateSlug", () => {
	it("lowercases the input", () => {
		expect(generateSlug("MySong")).toBe("mysong");
	});

	it("converts underscores to dashes via space normalization", () => {
		expect(generateSlug("my_song_name")).toBe("my-song-name");
	});

	it("replaces spaces with dashes", () => {
		expect(generateSlug("my song name")).toBe("my-song-name");
	});

	it("removes non-alphanumeric characters", () => {
		expect(generateSlug("song!@#$%name")).toBe("songname");
	});

	it("collapses multiple spaces into a single dash", () => {
		expect(generateSlug("my   song")).toBe("my-song");
	});

	it("collapses multiple dashes into one", () => {
		expect(generateSlug("my---song")).toBe("my-song");
	});

	it("trims leading and trailing dashes", () => {
		expect(generateSlug("  my song  ")).toBe("my-song");
	});

	it("handles mixed case and special chars", () => {
		expect(generateSlug("My_Song (v2)")).toBe("my-song-v2");
	});

	it("returns empty string for input with no alphanumeric chars", () => {
		expect(generateSlug("!@#$%")).toBe("");
	});
});
