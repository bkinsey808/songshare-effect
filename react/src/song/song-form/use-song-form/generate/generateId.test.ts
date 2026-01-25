import { describe, expect, it } from "vitest";

import generateId from "./generateId";

describe("generateId", () => {
	const FAKE_UUID = "12345678-90";

	it("uses crypto.randomUUID when available", () => {
		const fake = { randomUUID: () => FAKE_UUID } as const;
		Object.defineProperty(globalThis, "crypto", {
			value: fake,
			configurable: true,
			writable: true,
		});
		const id = generateId();
		expect(id).toBe(FAKE_UUID);
		// restore to an undefined crypto (keeps tests deterministic)
		Object.defineProperty(globalThis, "crypto", {
			value: undefined,
			configurable: true,
			writable: true,
		});
	});

	it("falls back to Math.random when crypto missing", () => {
		Object.defineProperty(globalThis, "crypto", {
			value: undefined,
			configurable: true,
			writable: true,
		});
		const id = generateId();
		expect(typeof id).toBe("string");
		// restore to an undefined crypto (keeps tests deterministic)
		Object.defineProperty(globalThis, "crypto", {
			value: undefined,
			configurable: true,
			writable: true,
		});
	});
});
