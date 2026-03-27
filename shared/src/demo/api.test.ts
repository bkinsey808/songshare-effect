import { describe, expect, it } from "vitest";

import { HTTP_STATUS } from "./api";

describe("demo api", () => {
	const statusCases = [
		{ name: "OK", value: HTTP_STATUS.OK },
		{ name: "CREATED", value: HTTP_STATUS.CREATED },
		{ name: "BAD_REQUEST", value: HTTP_STATUS.BAD_REQUEST },
		{ name: "UNAUTHORIZED", value: HTTP_STATUS.UNAUTHORIZED },
		{ name: "FORBIDDEN", value: HTTP_STATUS.FORBIDDEN },
		{ name: "NOT_FOUND", value: HTTP_STATUS.NOT_FOUND },
		{ name: "CONFLICT", value: HTTP_STATUS.CONFLICT },
		{ name: "INTERNAL_SERVER_ERROR", value: HTTP_STATUS.INTERNAL_SERVER_ERROR },
	];

	it.each(statusCases)("exports $name as number", ({ value }) => {
		// Assert
		expect(value).toBeDefined();
		expect(typeof value).toBe("number");
	});
});
