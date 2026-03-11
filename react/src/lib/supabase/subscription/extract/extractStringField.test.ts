import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractStringField from "./extractStringField";

describe("extractStringField", () => {
	it("returns string value when field exists and is string", () => {
		const record = { name: "alice", count: 5 };
		expect(extractStringField(record, "name")).toBe("alice");
	});

	it("returns undefined when field is not a string", () => {
		const record = { name: 123 };
		expect(extractStringField(record, "name")).toBeUndefined();
	});

	it("returns undefined when record is not an object", () => {
		expect(extractStringField(makeNull(), "name")).toBeUndefined();
		expect(extractStringField(undefined, "name")).toBeUndefined();
		expect(extractStringField("string", "name")).toBeUndefined();
	});

	it("returns undefined when field is missing", () => {
		const record = { other: "value" };
		expect(extractStringField(record, "missing")).toBeUndefined();
	});
});
