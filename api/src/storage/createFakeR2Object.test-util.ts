import forceCast from "@/shared/test-utils/forceCast.test-util";
import type { R2Object } from "@cloudflare/workers-types";

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
    writeHttpMetadata(headers: Headers) {
      void headers;
    },
  };

  return forceCast<R2Object>(fake);
}
