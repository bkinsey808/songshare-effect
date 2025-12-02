import { describe, expect, test } from "vitest";

import computeRedirectPort from "./computeRedirectPort";

describe("computeRedirectPort", () => {
	test("returns empty when no location info provided", () => {
		// simulate SSR / missing location by passing empty strings explicitly
		expect(computeRedirectPort({ hostname: "", port: "" })).toBe("");
	});

	test("returns default 5173 for localhost when port missing", () => {
		expect(computeRedirectPort({ hostname: "localhost", port: "" })).toBe("5173");
	});

	test("returns default 5173 for 127.0.0.1 when port missing", () => {
		expect(computeRedirectPort({ hostname: "127.0.0.1", port: "" })).toBe("5173");
	});

	test("returns default 5173 for hosts ending with .local when port missing", () => {
		expect(computeRedirectPort({ hostname: "dev.local", port: "" })).toBe("5173");
	});

	test("returns empty for production host with no port", () => {
		expect(computeRedirectPort({ hostname: "example.com", port: "" })).toBe("");
	});

	test("returns explicit port when provided", () => {
		expect(computeRedirectPort({ hostname: "example.com", port: "8888" })).toBe("8888");
	});

	test("explicit port preferred over default for localhost", () => {
		expect(computeRedirectPort({ hostname: "localhost", port: "3000" })).toBe("3000");
	});
});
