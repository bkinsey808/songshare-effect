import { describe, expect, it } from "vitest";

import { DEFAULT_DIRS } from "./constants";
import parseArgs from "./parseArgs";

describe("parseArgs", () => {
	it("returns defaults when no args provided", () => {
		const original = process.argv;
		process.argv = ["node", "script"]; // no extra args

		const result = parseArgs();

		expect(result.dirs).toStrictEqual(DEFAULT_DIRS);
		expect(result.format).toBe("plain");

		process.argv = original;
	});

	it("parses --dirs flag with comma separated values", () => {
		const original = process.argv;
		process.argv = ["node", "script", "--dirs=react,shared, api "];

		const result = parseArgs();

		expect(result.dirs).toStrictEqual(["react", "shared", "api"]);

		process.argv = original;
	});

	it("parses --format flag and ignores empty values", () => {
		const original = process.argv;
		process.argv = ["node", "script", "--format=github"];

		const result = parseArgs();

		expect(result.format).toBe("github");

		process.argv = original;
	});

	it("ignores malformed flags", () => {
		const original = process.argv;
		process.argv = ["node", "script", "--dirs=", "--format="];

		const result = parseArgs();

		expect(result.dirs).toStrictEqual(DEFAULT_DIRS);
		expect(result.format).toBe("plain");

		process.argv = original;
	});
});
