import { describe, expect, it } from "vitest";

import { HTTP_STATUS } from "./api";

describe("demo api", () => {
	it.each([
		["OK", HTTP_STATUS.OK],
		["CREATED", HTTP_STATUS.CREATED],
		["BAD_REQUEST", HTTP_STATUS.BAD_REQUEST],
		["UNAUTHORIZED", HTTP_STATUS.UNAUTHORIZED],
		["FORBIDDEN", HTTP_STATUS.FORBIDDEN],
		["NOT_FOUND", HTTP_STATUS.NOT_FOUND],
		["CONFLICT", HTTP_STATUS.CONFLICT],
		["INTERNAL_SERVER_ERROR", HTTP_STATUS.INTERNAL_SERVER_ERROR],
	] as const)("exports %s as number", (_name, value) => {
		expect(value).toBeDefined();
		expect(typeof value).toBe("number");
	});
});
