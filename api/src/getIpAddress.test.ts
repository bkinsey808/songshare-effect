import { describe, expect, it } from "vitest";

import makeCtx from "@/api/test-utils/makeCtx.mock";

import getIpAddress from "./getIpAddress";

describe("getIpAddress", () => {
	it("prefers cf-connecting-ip header when present", () => {
		const ctx = makeCtx({ headers: { "cf-connecting-ip": "1.2.3.4" } });
		expect(getIpAddress(ctx)).toBe("1.2.3.4");
	});

	it("uses first entry of x-forwarded-for when cf header missing", () => {
		const ctx = makeCtx({ headers: { "x-forwarded-for": "10.0.0.1, 127.0.0.1" } });
		expect(getIpAddress(ctx)).toBe("10.0.0.1");
	});

	it("skips empty x-forwarded-for entries and returns first non-empty", () => {
		const ctx = makeCtx({ headers: { "x-forwarded-for": ", 172.16.0.1" } });
		expect(getIpAddress(ctx)).toBe("172.16.0.1");
	});

	it("falls back to localhost when no forwarding headers present", () => {
		const ctx = makeCtx();
		expect(getIpAddress(ctx)).toBe("127.0.0.1");
	});
});
