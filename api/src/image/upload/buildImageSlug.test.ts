import { describe, expect, it } from "vitest";

import buildImageSlug from "./buildImageSlug";

const SLUG_BASE_MAX_LENGTH = 50;
const LONG_NAME_LENGTH = 60;
const SLICE_START = 0;
const SUFFIX = "short";

describe("buildImageSlug", () => {
	it("converts name to lowercase", () => {
		expect(buildImageSlug("My Image", "abc12345")).toBe("my-image-abc12345");
	});

	it("replaces spaces with hyphens", () => {
		expect(buildImageSlug("Hello World", "xyz")).toBe("hello-world-xyz");
	});

	it("replaces special characters with hyphens", () => {
		expect(buildImageSlug("Test@Image#1", "a1")).toBe("test-image-1-a1");
	});

	it("collapses consecutive hyphens", () => {
		expect(buildImageSlug("Multiple   Spaces", "x")).toBe("multiple-spaces-x");
	});

	it("trims leading and trailing hyphens from base", () => {
		expect(buildImageSlug("---Starts---", "y")).toBe("starts-y");
	});

	it("truncates base to 50 characters", () => {
		const longName = "a".repeat(LONG_NAME_LENGTH);
		const slug = buildImageSlug(longName, SUFFIX);
		const suffixPart = `-${SUFFIX}`;
		const base = slug.slice(SLICE_START, slug.length - suffixPart.length);
		expect(base).toHaveLength(SLUG_BASE_MAX_LENGTH);
	});

	it("appends suffix after hyphen", () => {
		expect(buildImageSlug("Title", "uuid12")).toBe("title-uuid12");
	});
});
