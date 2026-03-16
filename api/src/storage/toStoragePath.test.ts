import { describe, expect, it } from "vitest";

import toStoragePath from "./toStoragePath";

describe("toStoragePath", () => {
	it.each([
		["images/userId/imageId.jpg", "userId/imageId.jpg"],
		["images/foo/bar", "foo/bar"],
		["images/a", "a"],
	])("strips leading images/ prefix when present (%s -> %s)", (key, expected) => {
		expect(toStoragePath(key)).toStrictEqual(expected);
	});

	it.each([["userId/imageId.jpg"], ["foo"], [""]])(
		"returns key unchanged when it does not start with images/ (%s)",
		(key) => {
			expect(toStoragePath(key)).toStrictEqual(key);
		},
	);
});
