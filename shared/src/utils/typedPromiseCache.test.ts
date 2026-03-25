import { describe, expect, it } from "vitest";

import { createTypedCache } from "./typedPromiseCache";

const INCREMENT = 1;
const RESOLVE_VOID = 0;
const FIRST_VALUE = 42;
const SECOND_VALUE = 43;

describe("typedPromiseCache", () => {
	it("returns the fetched value on first get", async () => {
		// Arrange
		const cache = createTypedCache<number>("test");
		const keyId = "one";
		let counter = 0;

		// Act
		const val = await cache.get(keyId, async () => {
			counter += INCREMENT;
			await Promise.resolve(RESOLVE_VOID);
			return FIRST_VALUE;
		});

		// Assert
		expect(val).toBe(FIRST_VALUE);
		expect(counter).toBe(INCREMENT);
	});

	it("reuses cached promise on subsequent get", async () => {
		// Arrange
		const cache = createTypedCache<number>("test");
		const keyId = "one";
		let counter = 0;
		const EXPECTED_COUNTER = INCREMENT;

		// seed cache (first fetch)
		await cache.get(keyId, async () => {
			counter += INCREMENT;
			await Promise.resolve(RESOLVE_VOID);
			return FIRST_VALUE;
		});

		// Act: subsequent fetch should reuse cached promise
		const val2 = await cache.get(keyId, async () => {
			counter += INCREMENT;
			await Promise.resolve(RESOLVE_VOID);
			return SECOND_VALUE;
		});

		// Assert: cached value preserved and counter unchanged
		expect(val2).toBe(FIRST_VALUE);
		expect(counter).toBe(EXPECTED_COUNTER);
	});

	it("rejects when the fetcher throws", async () => {
		// Arrange
		const cache = createTypedCache<string>("err");
		const keyId = "f";

		// Act & Assert: first fetcher rejects
		await expect(
			cache.get(keyId, async () => {
				await Promise.resolve(RESOLVE_VOID);
				throw new Error("fail");
			}),
		).rejects.toThrow("fail");
	});

	it("calls the next fetcher after a rejection", async () => {
		// Arrange
		const cache = createTypedCache<string>("err");
		const keyId = "f";

		// Act: first fetcher rejects
		await expect(
			cache.get(keyId, async () => {
				await Promise.resolve(RESOLVE_VOID);
				throw new Error("fail");
			}),
		).rejects.toThrow("fail");

		// Act: next fetcher after rejection
		const val = await cache.get(keyId, async () => {
			await Promise.resolve(RESOLVE_VOID);
			return "ok";
		});

		// Assert
		expect(val).toBe("ok");
	});

	it("supports clear and delete", async () => {
		// Arrange
		const cache = createTypedCache<boolean>("b");
		const key1 = "a";
		const key2 = "b";

		await cache.get(key1, async () => {
			await Promise.resolve(RESOLVE_VOID);
			return true;
		});
		await cache.get(key2, async () => {
			await Promise.resolve(RESOLVE_VOID);
			return false;
		});

		// Act: delete and clear operations
		expect(cache.has(key1)).toBe(true);
		cache.delete(key1);

		// Assert: key1 removed
		expect(cache.has(key1)).toBe(false);

		// Act: clear
		cache.clear();

		// Assert: key2 removed
		expect(cache.has(key2)).toBe(false);
	});

	it("can be instantiated multiple times", () => {
		// Act
		const local = createTypedCache<number>("local");
		const key = "x";

		// Assert
		expect(local.has(key)).toBe(false);
	});
});
