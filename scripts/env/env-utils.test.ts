import { describe, expect, it } from "bun:test";

import { collectFlagValues, getArgValue, parseKeyValueLines, parseListLines } from "./env-utils";

describe("env-utils", () => {
	it("collects repeated flag values", () => {
		expect(collectFlagValues(["--config", "a", "--config", "b"], "--config")).toStrictEqual([
			"a",
			"b",
		]);
	});

	it("reads a flag value with fallback", () => {
		expect(getArgValue(["--service", "demo"], "--service", "default")).toBe("demo");
		expect(getArgValue(["--service"], "--service", "default")).toBe("default");
	});

	it("parses list lines", () => {
		expect(parseListLines("a\n# comment\n\n b ")).toStrictEqual(["a", "b"]);
	});

	it("parses key/value lines", () => {
		expect(parseKeyValueLines("ALPHA=1\n# ignore\nCHARLIE = 2\ninvalid")).toStrictEqual({
			ALPHA: "1",
			CHARLIE: "2",
		});
	});
});
