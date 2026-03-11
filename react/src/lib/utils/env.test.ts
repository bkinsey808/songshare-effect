import { describe, expect, it, vi } from "vitest";

import { getEnvString } from "@/shared/env/getEnv";

import { getEnvValue, getEnvValueSafe } from "./env";

vi.mock(
	"@/shared/env/getEnv",
	(): { getEnvString: (env: unknown, key: string) => string | undefined } => ({
		getEnvString: vi.fn(),
	}),
);

describe("getEnvValue", () => {
	it("returns value when getEnvString returns non-empty string", () => {
		vi.mocked(getEnvString).mockReturnValue("ok");
		expect(getEnvValue("TEST_VAR")).toBe("ok");
		expect(getEnvString).toHaveBeenCalledWith(import.meta.env, "VITE_TEST_VAR");
	});

	it("throws when getEnvString returns undefined", () => {
		vi.mocked(getEnvString).mockReturnValue(undefined);
		expect(() => getEnvValue("MISSING")).toThrow(
			"Environment variable VITE_MISSING is not defined or empty",
		);
	});

	it("throws when getEnvString returns empty string", () => {
		vi.mocked(getEnvString).mockReturnValue("");
		expect(() => getEnvValue("EMPTY")).toThrow(
			"Environment variable VITE_EMPTY is not defined or empty",
		);
	});
});

describe("getEnvValueSafe", () => {
	it("returns undefined when getEnvValue would throw", () => {
		vi.mocked(getEnvString).mockReturnValue(undefined);
		expect(getEnvValueSafe("NONEXISTENT")).toBeUndefined();
	});

	it("returns value when getEnvString returns value", () => {
		vi.mocked(getEnvString).mockReturnValue("safe-value");
		expect(getEnvValueSafe("SAFE_TEST")).toBe("safe-value");
	});
});
