import type { R2Object } from "@cloudflare/workers-types";

import forceCast from "@/shared/test-utils/forceCast.test-util";

/**
 * Mocking utility to create a fake Cloudflare R2 object.
 *
 * @param key - The object key (path) in R2
 * @returns A mocked R2Object
 */
export default function createFakeR2Object(key: string): R2Object {
	const fake: unknown = {
		key,
		version: "v",
		size: 0,
		etag: "e",
		httpEtag: "he",
		checksums: { toJSON: () => ({}) },
		uploaded: new Date(),
		httpMetadata: { contentType: "" },
		customMetadata: undefined,
		range: undefined,
		storageClass: "",
		ssecKeyMd5: undefined,
		/**
		 * @param headers - headers to write to
		 * @returns void
		 */
		writeHttpMetadata(headers: Headers) {
			void headers;
		},
	};

	return forceCast<R2Object>(fake);
}
