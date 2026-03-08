import { describe, expect, it } from "vitest";

import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";

import fetchOptionalPostgrestResponse from "./fetchOptionalPostgrestResponse";

const HTTP_OK = 200;

type SampleRow = { id: string; name: string };

describe("fetchOptionalPostgrestResponse", () => {
	it("returns the response when fetcher resolves to a defined response", async () => {
		const response = asPostgrestResponse<SampleRow[]>([
			{ id: "1", name: "First" },
			{ id: "2", name: "Second" },
		]);

		const result = await fetchOptionalPostgrestResponse<SampleRow[]>(() =>
			Promise.resolve(response),
		);

		expect(result).toBe(response);
		expect(result.data).toStrictEqual([
			{ id: "1", name: "First" },
			{ id: "2", name: "Second" },
		]);
	});

	it("returns the response when fetcher returns synchronously", async () => {
		const response = asPostgrestResponse<SampleRow[]>([{ id: "1", name: "Only" }]);

		const result = await fetchOptionalPostgrestResponse<SampleRow[]>(() => response);

		expect(result).toBe(response);
		expect(result.data).toStrictEqual([{ id: "1", name: "Only" }]);
	});

	it("returns empty response when fetcher resolves to undefined", async () => {
		const result = await fetchOptionalPostgrestResponse<SampleRow[]>(() =>
			Promise.resolve(undefined),
		);

		expect(result.data).toStrictEqual([]);
		expect(result.error).toBeNull();
		expect(result.count).toBeNull();
		expect(result.status).toBe(HTTP_OK);
		expect(result.statusText).toBe("OK");
	});

	it("returns empty response when fetcher returns undefined synchronously", async () => {
		const result = await fetchOptionalPostgrestResponse<SampleRow[]>(() => undefined);

		expect(result.data).toStrictEqual([]);
		expect(result.error).toBeNull();
		expect(result.count).toBeNull();
		expect(result.status).toBe(HTTP_OK);
		expect(result.statusText).toBe("OK");
	});
});
