import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import { getEnvString, getEnvStringOrDefault } from "./getEnv";

const KEY = "TEST_KEY";
const VALUE = "test-value";
const DEFAULT = "default-value";

describe("getEnvString", () => {
	it("returns string when key exists and value is string", () => {
		// Act
		const env = { [KEY]: VALUE };
		// Assert
		expect(getEnvString(env, KEY)).toBe(VALUE);
	});

	it("returns undefined for null and undefined env", () => {
		// Assert
		expect(getEnvString(makeNull(), KEY)).toBeUndefined();
		expect(getEnvString(undefined, KEY)).toBeUndefined();
	});

	it("returns undefined when key is missing", () => {
		// Assert
		expect(getEnvString({}, KEY)).toBeUndefined();
		expect(getEnvString({ other: "x" }, KEY)).toBeUndefined();
	});

	it("returns undefined when value is not a string", () => {
		// Assert
		expect(getEnvString({ [KEY]: 42 }, KEY)).toBeUndefined();
		expect(getEnvString({ [KEY]: {} }, KEY)).toBeUndefined();
	});
});

describe("getEnvStringOrDefault", () => {
	it("returns value when key exists", () => {
		// Act
		const env = { [KEY]: VALUE };
		// Assert
		expect(getEnvStringOrDefault(env, KEY, DEFAULT)).toBe(VALUE);
	});

	it("returns default when key is missing", () => {
		// Assert
		expect(getEnvStringOrDefault({}, KEY, DEFAULT)).toBe(DEFAULT);
	});

	it("returns default for null env", () => {
		// Assert
		expect(getEnvStringOrDefault(makeNull(), KEY, DEFAULT)).toBe(DEFAULT);
	});
});
