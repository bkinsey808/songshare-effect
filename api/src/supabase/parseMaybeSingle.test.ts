import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import parseMaybeSingle from "./parseMaybeSingle";

describe("parseMaybeSingle", () => {
	it("returns empty object when input is not a record", () => {
		expect(parseMaybeSingle(makeNull())).toStrictEqual({});
		expect(parseMaybeSingle(undefined)).toStrictEqual({});
		expect(parseMaybeSingle("string")).toStrictEqual({});
	});

	it("extracts data when present", () => {
		const data = { id: "1" };
		expect(parseMaybeSingle({ data })).toStrictEqual({ data });
	});

	it("extracts error when present", () => {
		const error = { message: "fail" };
		expect(parseMaybeSingle({ error })).toStrictEqual({ error });
	});

	it("extracts status when present and number", () => {
		const statusCode = 200;
		expect(parseMaybeSingle({ status: statusCode })).toStrictEqual({
			status: statusCode,
		});
	});

	it("extracts all fields when present", () => {
		const data = { id: "1" };
		const error = { message: "err" };
		const statusCode = 500;
		expect(parseMaybeSingle({ data, error, status: statusCode })).toStrictEqual({
			data,
			error,
			status: statusCode,
		});
	});

	it("ignores status when not a number", () => {
		expect(parseMaybeSingle({ status: "200" })).toStrictEqual({});
	});
});
