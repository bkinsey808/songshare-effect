import { describe, expect, it } from "vitest";

import { NetworkError, ParseError } from "./user-library-errors";

const STATUS_CODE_404 = 404;

describe("user-library-errors", () => {
	it("networkError has _tag and message", () => {
		const err = new NetworkError("fetch failed");
		expect(err._tag).toBe("NetworkError");
		expect(err.message).toBe("fetch failed");
		expect(err.statusCode).toBeUndefined();
	});

	it("networkError accepts optional statusCode", () => {
		const err = new NetworkError("not found", STATUS_CODE_404);
		expect(err.statusCode).toBe(STATUS_CODE_404);
	});

	it("parseError has _tag and message", () => {
		const err = new ParseError("invalid JSON");
		expect(err._tag).toBe("ParseError");
		expect(err.message).toBe("invalid JSON");
	});
});
