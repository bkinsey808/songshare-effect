import { describe, expect, it } from "vitest";

import getConnectionStatusClass from "./getConnectionStatusClass";

describe("getConnectionStatusClass", () => {
	it.each([
		["text-green-500", "SUBSCRIBED"],
		["text-red-500", "CHANNEL_ERROR"],
		["text-red-400", "CLOSED"],
		["text-yellow-500", "UNKNOWN"],
		["text-yellow-500", ""],
	] as const)("returns %s for status %s", (expected, status) => {
		expect(getConnectionStatusClass(status)).toBe(expected);
	});
});
