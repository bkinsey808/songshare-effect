import { describe, expect, it } from "bun:test";

import { parseWorkerVarNames, resolveServiceName } from "./set-cloudflare-secrets";

describe("set-cloudflare-secrets", () => {
	it("parses worker var names", () => {
		expect(parseWorkerVarNames("A\n# comment\nB\n")).toStrictEqual(["A", "B"]);
	});

	it("resolves service names", () => {
		expect(resolveServiceName("production", undefined)).toBe("songshare-production");
		expect(resolveServiceName("production", "")).toBe("songshare-production");
		expect(resolveServiceName("production", "custom")).toBe("custom");
	});
});
