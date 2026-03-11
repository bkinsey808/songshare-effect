import { describe, expect, it } from "vitest";

import getCookie from "./getCookie";

const COOKIE_NAME = "test-cookie";
const COOKIE_VALUE = "value%20encoded";

describe("getCookie", () => {
	it("returns cookie value when present", () => {
		Object.defineProperty(document, "cookie", {
			value: `${COOKIE_NAME}=${encodeURIComponent("decoded")}; other=ignore`,
			writable: true,
			configurable: true,
		});
		expect(getCookie(COOKIE_NAME)).toBe("decoded");
	});

	it("decodes URI-encoded cookie value", () => {
		Object.defineProperty(document, "cookie", {
			value: `${COOKIE_NAME}=${COOKIE_VALUE}`,
			writable: true,
			configurable: true,
		});
		expect(getCookie(COOKIE_NAME)).toBe("value encoded");
	});

	it("returns undefined when cookie is not present", () => {
		Object.defineProperty(document, "cookie", {
			value: "other=val",
			writable: true,
			configurable: true,
		});
		expect(getCookie(COOKIE_NAME)).toBeUndefined();
	});

	it("returns undefined when document.cookie is empty", () => {
		Object.defineProperty(document, "cookie", {
			value: "",
			writable: true,
			configurable: true,
		});
		expect(getCookie(COOKIE_NAME)).toBeUndefined();
	});
});
