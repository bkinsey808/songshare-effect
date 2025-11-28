/* eslint-disable no-magic-numbers, id-length */
import { describe, expect, it } from "vitest";

import { createTypedCache } from "./typedPromiseCache";

describe("TypedPromiseCache", () => {
	it("stores and returns typed values", async () => {
		const cache = createTypedCache<number>("test");
		const keyId = "one";

		let counter = 0;
		const val = await cache.get(keyId, async () => {
			counter += 1;
			await Promise.resolve(0);
			return 42;
		});

		expect(val).toBe(42);
		// Subsequent gets should reuse cached promise (counter not incremented)
		const val2 = await cache.get(keyId, async () => {
			counter += 1;
			await Promise.resolve(0);
			return 43;
		});
		expect(val2).toBe(42);
		expect(counter).toBe(1);
	});

	it("deletes on rejection so next fetcher is called", async () => {
		const cache = createTypedCache<string>("err");
		const keyId = "f";

		// first fetcher rejects
		await expect(
			cache.get(keyId, async () => {
				await Promise.resolve(0);
				return Promise.reject(new Error("fail"));
			}),
		).rejects.toThrow("fail");

		// after rejection, the cache should not hold the key, next fetcher runs
		const val = await cache.get(keyId, async () => {
			await Promise.resolve(0);
			return "ok";
		});
		expect(val).toBe("ok");
	});

	it("supports clear and delete", async () => {
		const cache = createTypedCache<boolean>("b");
		const key1 = "a";
		const key2 = "b";

		await cache.get(key1, async () => {
			await Promise.resolve(0);
			return true;
		});
		await cache.get(key2, async () => {
			await Promise.resolve(0);
			return false;
		});

		expect(cache.has(key1)).toBe(true);
		cache.delete(key1);
		expect(cache.has(key1)).toBe(false);

		cache.clear();
		expect(cache.has(key2)).toBe(false);
	});

	it("can be instantiated multiple times", () => {
		const local = createTypedCache<number>("local");
		const key = "x";
		expect(local.has(key)).toBe(false);
	});
});
