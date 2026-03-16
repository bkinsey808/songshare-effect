import type { R2Bucket, R2Conditional, R2PutOptions } from "@cloudflare/workers-types";
import { describe, expect, it, vi } from "vitest";

import createFakeR2Object from "./createFakeR2Object.test-util";
import createR2Adapter from "./createR2Adapter";

describe("createR2Adapter", () => {
	it("upload calls bucket.put with httpMetadata only when metadata is undefined", async () => {
		const putSpy = vi.fn();

		function put(
			key: string,
			value: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream<unknown> | null,
			options?: R2PutOptions | (R2PutOptions & { onlyIf: Headers | R2Conditional }),
		): Promise<ReturnType<typeof createFakeR2Object>> {
			putSpy(key, value, options);
			return Promise.resolve(createFakeR2Object(String(key)));
		}

		const deleteSpy = vi.fn();
		function del(key: string): Promise<void> {
			deleteSpy(key);
			return Promise.resolve();
		}

		const bucket: Pick<R2Bucket, "put" | "delete"> = { put, delete: del };
		const adapter = createR2Adapter(bucket);

		const encoded = new TextEncoder().encode("hello");
		const buf = new ArrayBuffer(encoded.length);
		new Uint8Array(buf).set(encoded);

		await adapter.upload("path/to/key", buf, { contentType: "text/plain" });

		expect(putSpy).toHaveBeenCalledWith("path/to/key", buf, {
			httpMetadata: { contentType: "text/plain" },
		});
	});

	it("upload includes customMetadata when provided", async () => {
		const putSpy = vi.fn();

		function put(
			key: string,
			value: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream<unknown> | null,
			options?: R2PutOptions | (R2PutOptions & { onlyIf: Headers | R2Conditional }),
		): Promise<ReturnType<typeof createFakeR2Object>> {
			putSpy(key, value, options);
			return Promise.resolve(createFakeR2Object(String(key)));
		}

		const deleteSpy = vi.fn();
		function del(key: string): Promise<void> {
			deleteSpy(key);
			return Promise.resolve();
		}

		const bucket: Pick<R2Bucket, "put" | "delete"> = { put, delete: del };
		const adapter = createR2Adapter(bucket);

		const encoded = new TextEncoder().encode("world");
		const buf = new ArrayBuffer(encoded.length);
		new Uint8Array(buf).set(encoded);
		const metadata = { foo: "bar" };

		await adapter.upload("k", buf, { contentType: "application/json", metadata });

		expect(putSpy).toHaveBeenCalledWith("k", buf, {
			httpMetadata: { contentType: "application/json" },
			customMetadata: metadata,
		});
	});

	it("remove calls bucket.delete with key", async () => {
		const deleteSpy = vi.fn();

		function put(
			_key: string,
			_value: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream<unknown> | null,
			_options?: R2PutOptions | (R2PutOptions & { onlyIf: Headers | R2Conditional }),
		): Promise<ReturnType<typeof createFakeR2Object>> {
			return Promise.resolve(createFakeR2Object("k"));
		}

		function del(key: string): Promise<void> {
			deleteSpy(key);
			return Promise.resolve();
		}

		const bucket: Pick<R2Bucket, "put" | "delete"> = { put, delete: del };
		const adapter = createR2Adapter(bucket);

		await adapter.remove("k");

		expect(deleteSpy).toHaveBeenCalledWith("k");
	});
});
